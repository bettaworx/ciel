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

	/** Minimal stand-ins for the browser encode path, counting encodes. */
	function stubCanvas() {
		const state = { encodes: 0 };
		vi.stubGlobal('createImageBitmap', async () => ({
			width: 10,
			height: 10,
			close() {},
		}));
		vi.stubGlobal(
			'OffscreenCanvas',
			class {
				constructor(
					public width: number,
					public height: number,
				) {}
				getContext() {
					return { drawImage() {} };
				}
				async convertToBlob() {
					state.encodes++;
					return new Blob([new Uint8Array(4)], { type: 'image/webp' });
				}
			},
		);
		return state;
	}

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
			maxBytes: LIMIT,
		});

		expect(bitrate).not.toBeNull();
		expect(bitrate!).toBeGreaterThan(0);
		expect(outputBytes(bitrate!, 30)).toBeLessThan(2 * MiB);
	});
});
