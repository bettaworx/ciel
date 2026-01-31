// Minimal SCRAM-SHA-256-style client proof implementation to match backend/internal/auth/scram.go

type Bytes = Uint8Array<ArrayBuffer>;

function bytesToBinaryString(bytes: Bytes): string {
	let s = '';
	for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
	return s;
}

function binaryStringToBytes(s: string): Bytes {
	const out = new Uint8Array(s.length) as Bytes;
	for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
	return out;
}

export function base64StdEncode(bytes: Bytes): string {
	return btoa(bytesToBinaryString(bytes));
}

export function base64StdDecode(b64: string): Bytes {
	return binaryStringToBytes(atob(b64));
}

export function base64UrlEncode(bytes: Bytes): string {
	return base64StdEncode(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function randomBase64Url(nBytes: number): string {
	const bytes = new Uint8Array(nBytes) as Bytes;
	crypto.getRandomValues(bytes);
	return base64UrlEncode(bytes);
}

function xorBytes(a: Bytes, b: Bytes): Bytes {
	const out = new Uint8Array(a.length) as Bytes;
	for (let i = 0; i < a.length && i < b.length; i++) out[i] = a[i]! ^ b[i]!;
	return out;
}

async function sha256(bytes: Bytes): Promise<Bytes> {
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return new Uint8Array(digest) as Bytes;
}

async function hmacSha256(keyBytes: Bytes, messageBytes: Bytes): Promise<Bytes> {
	const key = await crypto.subtle.importKey(
		'raw',
		keyBytes,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, messageBytes);
	return new Uint8Array(sig) as Bytes;
}

async function pbkdf2Sha256(password: string, salt: Bytes, iterations: number, lengthBytes = 32): Promise<Bytes> {
	const enc = new TextEncoder();
	const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
		'deriveBits'
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
		baseKey,
		lengthBytes * 8
	);
	return new Uint8Array(bits) as Bytes;
}

export function buildAuthMessage(
	username: string,
	clientNonce: string,
	serverNonce: string,
	saltB64: string,
	iterations: number,
	clientFinalNonce: string
): string {
	const clientFirstBare = `n=${username},r=${clientNonce}`;
	const serverFirst = `r=${clientNonce}${serverNonce},s=${saltB64},i=${iterations}`;
	const clientFinalWithoutProof = `c=biws,r=${clientFinalNonce}`;
	return `${clientFirstBare},${serverFirst},${clientFinalWithoutProof}`;
}

export async function computeClientProof(params: {
	username: string;
	password: string;
	clientNonce: string;
	serverNonce: string;
	saltB64: string;
	iterations: number;
}): Promise<{ clientFinalNonce: string; clientProofB64: string; authMessage: string }> {
	const clientFinalNonce = params.clientNonce + params.serverNonce;
	const authMessage = buildAuthMessage(
		params.username,
		params.clientNonce,
		params.serverNonce,
		params.saltB64,
		params.iterations,
		clientFinalNonce
	);

	const salt = base64StdDecode(params.saltB64);
	const saltedPassword = await pbkdf2Sha256(params.password, salt, params.iterations, 32);

	const enc = new TextEncoder();
	const clientKey = await hmacSha256(saltedPassword, enc.encode('Client Key') as Bytes);
	const storedKey = await sha256(clientKey);

	const clientSignature = await hmacSha256(storedKey, enc.encode(authMessage) as Bytes);
	const proof = xorBytes(clientKey, clientSignature);
	const clientProofB64 = base64StdEncode(proof);

	return { clientFinalNonce, clientProofB64, authMessage };
}
