import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	fitWithin,
	isGifFile,
	isVideoFile,
	normalizeForUpload,
	pickVideoBitrate,
	replaceExt,
} from './normalize';

const file = (name: string, type: string) => new File([new Uint8Array(1)], name, { type });

/** Stands in for the browser encode path, recording what it was asked to do. */
function stubCanvas(source = { width: 10, height: 10 }) {
	const state = { encodes: 0, width: 0, height: 0, quality: 0, smoothing: true };
	vi.stubGlobal('createImageBitmap', async () => ({ ...source, close() {} }));
	vi.stubGlobal(
		'OffscreenCanvas',
		class {
			constructor(
				public width: number,
				public height: number,
			) {
				state.width = width;
				state.height = height;
			}
			getContext() {
				return {
					drawImage() {},
					set imageSmoothingEnabled(v: boolean) {
						state.smoothing = v;
					},
				};
			}
			async convertToBlob(options: { quality: number }) {
				state.encodes++;
				state.quality = options.quality;
				return new Blob([new Uint8Array(4)], { type: 'image/webp' });
			}
		},
	);
	return state;
}


describe('fitWithin', () => {
	it('leaves images that already fit untouched', () => {
		expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 });
		expect(fitWithin(2048, 100, 2048)).toEqual({ width: 2048, height: 100 });
	});

	it('scales the longest edge down and preserves aspect ratio', () => {
		expect(fitWithin(4096, 2048, 2048)).toEqual({ width: 2048, height: 1024 });
		expect(fitWithin(1000, 4000, 2000)).toEqual({ width: 500, height: 2000 });
	});

	it('never rounds an edge down to zero', () => {
		expect(fitWithin(10000, 1, 100)).toEqual({ width: 100, height: 1 });
	});
});

describe('replaceExt', () => {
	it('swaps the extension', () => {
		expect(replaceExt('cat.HEIC', 'webp')).toBe('cat.webp');
		expect(replaceExt('clip.mov', 'webm')).toBe('clip.webm');
	});

	it('keeps dots inside the basename', () => {
		expect(replaceExt('my.photo.v2.png', 'webp')).toBe('my.photo.v2.webp');
	});

	it('handles names with no extension and empty names', () => {
		expect(replaceExt('screenshot', 'webp')).toBe('screenshot.webp');
		expect(replaceExt('.gitignore', 'webp')).toBe('media.webp');
	});
});

describe('file classification', () => {
	it('detects video by MIME type', () => {
		expect(isVideoFile(file('a.mp4', 'video/mp4'))).toBe(true);
		expect(isVideoFile(file('a.png', 'image/png'))).toBe(false);
	});

	it('falls back to the extension when the OS reports no MIME type', () => {
		expect(isVideoFile(file('a.mkv', ''))).toBe(true);
		expect(isGifFile(file('a.gif', ''))).toBe(true);
	});

	it('detects gif by MIME type', () => {
		expect(isGifFile(file('whatever', 'image/gif'))).toBe(true);
		expect(isGifFile(file('a.webp', 'image/webp'))).toBe(false);
	});
});

describe('normalizeForUpload', () => {
	afterEach(() => vi.unstubAllGlobals());


	it('re-encodes a still image to webp', async () => {
		const state = stubCanvas();
		const png = new File([new Uint8Array(4)], 'a.png', { type: 'image/png' });

		const result = await normalizeForUpload(png);

		expect(state.encodes).toBe(1);
		expect(result.name).toBe('a.webp');
		expect(result.type).toBe('image/webp');
	});

	// The composer converts video on attach and the upload path normalizes again,
	// so an already-normalized file has to pass straight through.
	it('never converts its own output a second time', async () => {
		const state = stubCanvas();
		const png = new File([new Uint8Array(4)], 'a.png', { type: 'image/png' });

		const once = await normalizeForUpload(png);
		const twice = await normalizeForUpload(once);

		expect(twice).toBe(once);
		expect(state.encodes).toBe(1);
	});

	// The upload path re-reads the file out of a FormData before normalizing, so
	// the mark has to survive that round trip. It only does while no filename
	// argument is passed to FormData.set().
	it('survives a FormData round trip', async () => {
		const state = stubCanvas();
		const png = new File([new Uint8Array(4)], 'a.png', { type: 'image/png' });
		const once = await normalizeForUpload(png);

		const form = new FormData();
		form.set('file', once);
		const roundTripped = form.get('file') as File;

		expect(roundTripped).toBe(once);
		expect(await normalizeForUpload(roundTripped)).toBe(once);
		expect(state.encodes).toBe(1);
	});

	it('passes gifs through untouched', async () => {
		const gif = new File([new Uint8Array(4)], 'a.gif', { type: 'image/gif' });
		expect(await normalizeForUpload(gif)).toBe(gif);
	});
});

describe('pickVideoBitrate', () => {
	const MiB = 1024 * 1024;
	const LIMIT = 100 * MiB;

	/** Output size the chosen bitrate implies, including the 96 kbps audio track. */
	const outputBytes = (bitrate: number, durationSec: number) =>
		((bitrate + 96_000) * durationSec) / 8;

	// 2023-07-18 12-47-26.mkv: 32.4 MB, 97.2s, 2152x2252 HEVC 60fps -> 2.67 Mbps.
	// Downscaled to 1835x1920, the quality ceiling is 10.6 Mbps and the size
	// budget 7.7 Mbps, so without the source limit this was re-encoded at 7.7
	// Mbps into a ~90 MiB file: nearly three times the input.
	it('never spends more bits than the source did', () => {
		const bitrate = pickVideoBitrate({
			fileSize: 32_418_755,
			durationSec: 97.2,
			width: 1835,
			height: 1920,
			bitsPerPixel: 0.1,
			maxBytes: LIMIT,
		});

		expect(bitrate).not.toBeNull();
		expect(bitrate!).toBeLessThan(2_700_000);
		expect(outputBytes(bitrate!, 97.2)).toBeLessThan(35 * MiB);
	});

	it('caps a high-bitrate source at the quality ceiling', () => {
		// 50 Mbps 4K source, downscaled to 1920x1080.
		const bitrate = pickVideoBitrate({
			fileSize: 50_000_000 * 20 / 8,
			durationSec: 20,
			width: 1920,
			height: 1080,
			bitsPerPixel: 0.1,
			maxBytes: LIMIT,
		});

		expect(bitrate).toBe(Math.round(0.1 * 1920 * 1080 * 30));
	});

	it('lets the size budget bind on a long video', () => {
		// 5 minutes at a source bitrate far above what the limit allows.
		const durationSec = 300;
		const bitrate = pickVideoBitrate({
			fileSize: 2_000 * MiB,
			durationSec,
			width: 1920,
			height: 1080,
			bitsPerPixel: 0.1,
			maxBytes: LIMIT,
		});

		expect(bitrate).not.toBeNull();
		expect(outputBytes(bitrate!, durationSec)).toBeLessThan(LIMIT);
	});

	it('rejects a video too long to fit at a watchable bitrate', () => {
		expect(
			pickVideoBitrate({
				fileSize: 2_000 * MiB,
				durationSec: 3600,
				width: 1920,
				height: 1080,
				bitsPerPixel: 0.1,
			maxBytes: LIMIT,
			}),
		).toBeNull();
	});

	// The source limit must not be mistaken for "cannot fit": a clip that was
	// already tiny should stay tiny, not be rejected.
	it('keeps an already-tiny video instead of rejecting it', () => {
		const bitrate = pickVideoBitrate({
			fileSize: 200 * 1024,
			durationSec: 30,
			width: 640,
			height: 480,
			bitsPerPixel: 0.1,
			maxBytes: LIMIT,
		});

		expect(bitrate).not.toBeNull();
		expect(bitrate!).toBeGreaterThan(0);
		expect(outputBytes(bitrate!, 30)).toBeLessThan(2 * MiB);
	});
});

describe('quality modes', () => {
	afterEach(() => vi.unstubAllGlobals());


	const png = () => new File([new Uint8Array(4)], 'a.png', { type: 'image/png' });

	it('resizes and compresses according to the image mode', async () => {
		const cases = [
			{ mode: 'performance', edge: 1280, quality: 0.65 },
			{ mode: 'balance', edge: 2048, quality: 0.82 },
			{ mode: 'quality', edge: 3072, quality: 0.95 },
		] as const;

		for (const { mode, edge, quality } of cases) {
			const state = stubCanvas({ width: 4000, height: 2000 });
			await normalizeForUpload(png(), { imageMode: mode });

			expect(state.width, mode).toBe(edge);
			expect(state.height, mode).toBe(edge / 2);
			expect(state.quality, mode).toBe(quality);
			expect(state.smoothing, mode).toBe(true);
			vi.unstubAllGlobals();
		}
	});

	// Pixel art must come out the size it went in, with no interpolation.
	it('leaves dot-by-dot at its original size with smoothing off', async () => {
		const state = stubCanvas({ width: 4000, height: 2000 });

		await normalizeForUpload(png(), { imageMode: 'dot-by-dot' });

		expect(state.width).toBe(4000);
		expect(state.height).toBe(2000);
		expect(state.quality).toBe(1);
		expect(state.smoothing).toBe(false);
	});

	// 'none' is the poster saying the file already suits the server.
	it('uploads untouched in the none mode', async () => {
		const state = stubCanvas({ width: 4000, height: 2000 });
		const webp = new File([new Uint8Array(4)], 'a.webp', { type: 'image/webp' });

		const result = await normalizeForUpload(webp, { imageMode: 'none' });

		expect(result).toBe(webp);
		expect(state.encodes).toBe(0);
		// Still marked, so the upload path does not convert it either.
		expect(await normalizeForUpload(result)).toBe(webp);
		expect(state.encodes).toBe(0);
	});

	// The mode picks the quality; the server picks what it will accept. When the
	// server's ceiling is the lower of the two, it wins.
	it('never scales past what the server accepts', async () => {
		const state = stubCanvas({ width: 4000, height: 2000 });

		await normalizeForUpload(png(), {
			imageMode: 'quality',
			limits: { maxWidth: 800, maxHeight: 800, maxPixels: 50_000_000, maxFrameRate: 60 },
		});

		expect(state.width).toBe(800);
		expect(state.height).toBe(400);
	});

	it('holds dot-by-dot to the server ceiling too', async () => {
		const state = stubCanvas({ width: 4000, height: 2000 });

		await normalizeForUpload(png(), {
			imageMode: 'dot-by-dot',
			limits: { maxWidth: 1000, maxHeight: 1000, maxPixels: 50_000_000, maxFrameRate: 60 },
		});

		// Resizing pixel art is a loss, but an upload the server refuses is worse.
		expect(state.width).toBe(1000);
		expect(state.smoothing).toBe(false);
	});

	it('rejects an image over the server pixel budget', async () => {
		stubCanvas({ width: 9000, height: 9000 });

		await expect(
			normalizeForUpload(png(), {
				limits: { maxWidth: 16384, maxHeight: 16384, maxPixels: 50_000_000, maxFrameRate: 60 },
			}),
		).rejects.toThrow();
	});

	it('raises and lowers the video ceiling with the video mode', () => {
		// A short clip, so the ceiling binds rather than the budget or the source.
		const args = {
			fileSize: 500 * 1024 * 1024,
			durationSec: 10,
			width: 1920,
			height: 1080,
			maxBytes: 100 * 1024 * 1024,
		};

		const performance = pickVideoBitrate({ ...args, bitsPerPixel: 0.07 });
		const balance = pickVideoBitrate({ ...args, bitsPerPixel: 0.1 });
		const quality = pickVideoBitrate({ ...args, bitsPerPixel: 0.15 });

		expect(performance).toBeLessThan(balance!);
		expect(balance).toBeLessThan(quality!);
		expect(balance).toBe(Math.round(0.1 * 1920 * 1080 * 30));
	});
});
