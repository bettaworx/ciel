import { describe, expect, it } from 'vitest';
import { buildSignPayload, decryptValue, encryptValue } from './account-tokens';

async function vaultKey() {
	return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

describe('account token vault', () => {
	it('round-trips a token', async () => {
		const key = await vaultKey();
		const userId = 'b3f1c0de-0000-4000-8000-000000000001';

		const stored = await encryptValue(key, userId, 'super-secret-token');

		expect(new TextDecoder().decode(stored.ciphertext)).not.toContain('super-secret-token');
		await expect(decryptValue(key, userId, stored)).resolves.toBe('super-secret-token');
	});

	it('uses a fresh IV per write, so the same token never yields the same bytes', async () => {
		const key = await vaultKey();
		const userId = 'b3f1c0de-0000-4000-8000-000000000001';

		const first = await encryptValue(key, userId, 'same-token');
		const second = await encryptValue(key, userId, 'same-token');

		expect(Array.from(first.iv)).not.toEqual(Array.from(second.iv));
		expect(new Uint8Array(first.ciphertext)).not.toEqual(new Uint8Array(second.ciphertext));
	});

	it('refuses to decrypt a ciphertext moved to another account', async () => {
		const key = await vaultKey();
		const stored = await encryptValue(key, 'account-a', 'token-a');

		await expect(decryptValue(key, 'account-b', stored)).rejects.toThrow();
	});

	it('refuses a tampered ciphertext', async () => {
		const key = await vaultKey();
		const stored = await encryptValue(key, 'account-a', 'token-a');

		const tampered = new Uint8Array(stored.ciphertext);
		tampered[0] ^= 0xff;

		await expect(decryptValue(key, 'account-a', { ...stored, ciphertext: tampered.buffer })).rejects.toThrow();
	});

	it('refuses a foreign key', async () => {
		const stored = await encryptValue(await vaultKey(), 'account-a', 'token-a');

		await expect(decryptValue(await vaultKey(), 'account-a', stored)).rejects.toThrow();
	});
});

describe('signature payload', () => {
	// Must stay byte-identical to auth.DeviceSignaturePayload on the backend, or
	// every switch fails signature verification.
	it('joins token, timestamp and nonce with dots', () => {
		expect(buildSignPayload('tok', 1_700_000_000, 'nonce')).toBe('tok.1700000000.nonce');
	});
});
