'use client';

/**
 * Client-side storage for the account tokens that let the user switch between
 * signed-in accounts without typing a password again.
 *
 * Two keys live in IndexedDB, both generated with `extractable: false`, so the
 * raw key material cannot be read back out even by our own code:
 *
 * - a vault key (AES-GCM) that encrypts the tokens at rest, with the account id
 *   as additional data so a ciphertext cannot be moved to another account's row;
 * - a device key pair (ECDSA P-256) whose public half the server stores next to
 *   the token. Every exchange carries a fresh signature, so a token lifted out
 *   of storage is worthless on any other machine.
 *
 * What this does NOT protect against: script running on this page right now. It
 * can ask us to decrypt and sign, exactly as it could ride the session cookie.
 * The guarantee is about the data leaving the browser, not about XSS.
 */

const DB_NAME = 'ciel-auth';
const DB_VERSION = 1;
const KEY_STORE = 'keys';
const TOKEN_STORE = 'tokens';
const VAULT_KEY_ID = 'vault';
const DEVICE_KEY_ID = 'device';

type StoredToken = {
	userId: string;
	iv: Uint8Array<ArrayBuffer>;
	ciphertext: ArrayBuffer;
};

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
			if (!db.objectStoreNames.contains(TOKEN_STORE)) db.createObjectStore(TOKEN_STORE, { keyPath: 'userId' });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function read<T>(store: string, key: string): Promise<T | undefined> {
	const db = await openDb();
	try {
		return await promisify<T>(db.transaction(store, 'readonly').objectStore(store).get(key));
	} finally {
		db.close();
	}
}

async function write(store: string, value: unknown, key?: string): Promise<void> {
	const db = await openDb();
	try {
		const target = db.transaction(store, 'readwrite').objectStore(store);
		// A store with a keyPath rejects an explicit key argument, even undefined.
		await promisify(key === undefined ? target.put(value) : target.put(value, key));
	} finally {
		db.close();
	}
}

/**
 * Read-or-create for the two keys. Two tabs starting at once would otherwise
 * each generate a key and the loser's tokens would decrypt to garbage, so the
 * freshly generated key is only kept if nothing was stored in the meantime.
 */
async function getOrCreate<T>(id: string, create: () => Promise<T>): Promise<T> {
	const existing = await read<T>(KEY_STORE, id);
	if (existing) return existing;

	const created = await create();
	const db = await openDb();
	try {
		const store = db.transaction(KEY_STORE, 'readwrite').objectStore(KEY_STORE);
		const raced = await promisify<T | undefined>(store.get(id));
		if (raced) return raced;
		await promisify(store.put(created, id));
		return created;
	} finally {
		db.close();
	}
}

function getVaultKey(): Promise<CryptoKey> {
	return getOrCreate(VAULT_KEY_ID, () =>
		crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
	);
}

function getDeviceKeyPair(): Promise<CryptoKeyPair> {
	// `extractable: false` applies to the private key; the public half stays
	// exportable, which is what the server needs to verify signatures.
	return getOrCreate(DEVICE_KEY_ID, () =>
		crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify'])
	);
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
	const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let binary = '';
	for (const byte of view) binary += String.fromCharCode(byte);
	return btoa(binary);
}

/** SPKI public key of this browser's device key, base64, for the mint call. */
export async function getDevicePublicKey(): Promise<string> {
	const { publicKey } = await getDeviceKeyPair();
	return toBase64(await crypto.subtle.exportKey('spki', publicKey));
}

/** Must match auth.DeviceSignaturePayload in apps/backend/internal/auth/device_key.go. */
export function buildSignPayload(token: string, timestamp: number, nonce: string): string {
	return `${token}.${timestamp}.${nonce}`;
}

/** The proof of possession that accompanies every account token exchange. */
export async function signExchange(token: string): Promise<{ timestamp: number; nonce: string; signature: string }> {
	const { privateKey } = await getDeviceKeyPair();
	const timestamp = Math.floor(Date.now() / 1000);
	const nonce = toBase64(crypto.getRandomValues(new Uint8Array(16)));
	const signature = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		privateKey,
		new TextEncoder().encode(buildSignPayload(token, timestamp, nonce))
	);
	return { timestamp, nonce, signature: toBase64(signature) };
}

export async function encryptValue(key: CryptoKey, userId: string, value: string) {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(userId) },
		key,
		new TextEncoder().encode(value)
	);
	return { iv, ciphertext };
}

export async function decryptValue(
	key: CryptoKey,
	userId: string,
	payload: { iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer }
): Promise<string> {
	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: payload.iv, additionalData: new TextEncoder().encode(userId) },
		key,
		payload.ciphertext
	);
	return new TextDecoder().decode(plaintext);
}

export async function saveAccountToken(userId: string, token: string): Promise<void> {
	const { iv, ciphertext } = await encryptValue(await getVaultKey(), userId, token);
	await write(TOKEN_STORE, { userId, iv, ciphertext } satisfies StoredToken);
}

/** Returns null when there is nothing stored, or when it no longer decrypts. */
export async function loadAccountToken(userId: string): Promise<string | null> {
	const stored = await read<StoredToken>(TOKEN_STORE, userId);
	if (!stored) return null;
	try {
		return await decryptValue(await getVaultKey(), userId, stored);
	} catch {
		await deleteAccountToken(userId);
		return null;
	}
}

export async function deleteAccountToken(userId: string): Promise<void> {
	const db = await openDb();
	try {
		await promisify(db.transaction(TOKEN_STORE, 'readwrite').objectStore(TOKEN_STORE).delete(userId));
	} finally {
		db.close();
	}
}
