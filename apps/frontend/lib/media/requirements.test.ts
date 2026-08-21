import { describe, expect, it } from 'vitest';
import type { components } from '@/lib/api/api';
import {
	FALLBACK_MEDIA_REQUIREMENTS,
	toMediaRequirements,
} from './requirements';

type ServerConfig = components['schemas']['ServerConfig'];

function config(overrides: {
	allowedExtensions?: string[];
	maxUploadSizeMB?: number;
}): ServerConfig {
	return {
		configVersion: 1,
		maxPostContentLength: 1000,
		signupEnabled: true,
		mediaLimits: {
			maxUploadSizeMB: overrides.maxUploadSizeMB ?? 15,
			allowedExtensions: overrides.allowedExtensions ?? ['webp', 'gif', 'webm', 'mp4'],
			maxInputWidth: 16384,
			maxInputHeight: 16384,
			maxInputPixels: 50_000_000,
			post: { static: { maxSize: 2048 }, gif: { maxSize: 1024 } },
			avatar: { size: 400 },
			banner: {
				static: { width: 1500, height: 500 },
				gif: { width: 1500, height: 500 },
			},
			serverIcon: { static: { size: 512 }, gif: { maxSize: 512 } },
			emoji: { static: { height: 128 }, gif: { height: 128 } },
			video: {
				maxUploadSizeMB: 100,
				maxDurationSeconds: 300,
				maxSize: 1920,
				maxFrameRate: 60,
			},
		},
	} as ServerConfig;
}

describe('toMediaRequirements', () => {
	it('turns the server extension list into MIME types, split by kind', () => {
		const req = toMediaRequirements(
			config({ allowedExtensions: ['webp', 'png', 'jpg', 'jpeg', 'gif', 'webm', 'mp4'] }),
		);

		expect(req.imageMimeTypes.sort()).toEqual([
			'image/gif',
			'image/jpeg',
			'image/png',
			'image/webp',
		]);
		expect(req.videoMimeTypes.sort()).toEqual(['video/mp4', 'video/webm']);
	});

	// This is the whole point: narrowing the server's list has to reach the client
	// rather than leaving a second hardcoded copy behind.
	it('drops a type the server stops allowing', () => {
		const req = toMediaRequirements(config({ allowedExtensions: ['webp', 'webm'] }));

		expect(req.imageMimeTypes).toEqual(['image/webp']);
		expect(req.videoMimeTypes).toEqual(['video/webm']);
	});

	it('maps jpg and jpeg onto one MIME type without duplicating it', () => {
		const req = toMediaRequirements(config({ allowedExtensions: ['jpg', 'jpeg'] }));
		expect(req.imageMimeTypes).toEqual(['image/jpeg']);
	});

	it('ignores extensions it has no mapping for', () => {
		const req = toMediaRequirements(config({ allowedExtensions: ['webp', 'tiff', 'heic'] }));
		expect(req.imageMimeTypes).toEqual(['image/webp']);
	});

	it('converts megabyte limits to bytes', () => {
		const req = toMediaRequirements(config({ maxUploadSizeMB: 20 }));
		expect(req.maxImageBytes).toBe(20 * 1024 * 1024);
		expect(req.maxVideoBytes).toBe(100 * 1024 * 1024);
	});

	it('falls back while the config request is still in flight', () => {
		expect(toMediaRequirements(undefined)).toBe(FALLBACK_MEDIA_REQUIREMENTS);
	});
});
