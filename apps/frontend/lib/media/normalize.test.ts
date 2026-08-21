import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	fitWithin,
	isGifFile,
	isVideoFile,
	normalizeForUpload,
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
