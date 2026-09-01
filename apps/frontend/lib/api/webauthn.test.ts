import { describe, expect, it } from 'vitest';
import { __internal } from '@/lib/api/webauthn';

const { base64UrlToBuffer, bufferToBase64Url, manualCreationOptions, manualRequestOptions } =
	__internal;

const bytes = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer));

describe('base64url', () => {
	it('round-trips every byte value', () => {
		const source = new Uint8Array(256).map((_, i) => i);
		const encoded = bufferToBase64Url(source.buffer);
		expect(encoded).not.toMatch(/[+/=]/);
		expect(bytes(base64UrlToBuffer(encoded))).toEqual(Array.from(source));
	});

	it('decodes unpadded input of every length mod 4', () => {
		for (const length of [1, 2, 3, 4, 5]) {
			const source = new Uint8Array(length).map((_, i) => i * 7 + 1);
			expect(bytes(base64UrlToBuffer(bufferToBase64Url(source.buffer)))).toEqual(
				Array.from(source),
			);
		}
	});

	it('accepts the - and _ alphabet the server emits', () => {
		// 0xfb 0xff encodes as "+/" in standard base64 and "-_" in base64url.
		expect(bytes(base64UrlToBuffer('-_8'))).toEqual([0xfb, 0xff]);
	});
});

// The fallback path, used on engines without PublicKeyCredential.parse*FromJSON.
describe('manual option conversion', () => {
	const creationJson = {
		publicKey: {
			challenge: 'AQID',
			rp: { id: 'localhost', name: 'Ciel' },
			user: { id: 'BAUG', name: 'alice', displayName: 'alice' },
			pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
			excludeCredentials: [{ id: 'BwgJ', type: 'public-key', transports: ['usb'] }],
		},
	};

	it('turns the base64url fields into buffers and leaves the rest alone', () => {
		const options = manualCreationOptions(creationJson);

		expect(bytes(options.challenge as ArrayBuffer)).toEqual([1, 2, 3]);
		expect(bytes(options.user.id as ArrayBuffer)).toEqual([4, 5, 6]);
		expect(bytes(options.excludeCredentials![0].id as ArrayBuffer)).toEqual([7, 8, 9]);
		expect(options.excludeCredentials![0].transports).toEqual(['usb']);
		expect(options.user.name).toBe('alice');
		expect(options.rp.id).toBe('localhost');
	});

	it('converts assertion options and tolerates a missing allowCredentials', () => {
		const options = manualRequestOptions({
			publicKey: { challenge: 'AQID', rpId: 'localhost' },
		});

		expect(bytes(options.challenge as ArrayBuffer)).toEqual([1, 2, 3]);
		expect(options.allowCredentials).toBeUndefined();
	});
});
