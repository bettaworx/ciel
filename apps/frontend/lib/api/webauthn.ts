'use client';

/**
 * Browser side of the WebAuthn ceremonies.
 *
 * The backend hands us go-webauthn's wire format verbatim:
 * `{ sessionId, options: { publicKey: { ... } } }`, where every binary field
 * (challenge, user.id, credential ids) is a base64url string. That is exactly
 * the shape the platform's own JSON helpers speak, so the happy path is two
 * native calls. `parseCreationOptionsFromJSON` / `parseRequestOptionsFromJSON`
 * only landed in Firefox 135, so a small manual conversion covers older
 * engines; the conversions live here and nowhere else.
 */

/** JSON blob as returned by the API — deliberately loose, it is not ours. */
type OptionsJson = { [key: string]: unknown };

export function isWebAuthnAvailable(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.PublicKeyCredential === 'function' &&
		typeof navigator.credentials?.create === 'function'
	);
}

function base64UrlToBuffer(value: string): ArrayBuffer {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

function bufferToBase64Url(value: ArrayBuffer): string {
	const bytes = new Uint8Array(value);
	let binary = '';
	for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Unwraps `{ publicKey: {...} }`; the RP JSON always carries that wrapper. */
function publicKeyOf(options: OptionsJson): OptionsJson {
	const inner = options.publicKey;
	if (inner && typeof inner === 'object') return inner as OptionsJson;
	return options;
}

type CredentialDescriptorJson = { id: string; type: string; transports?: string[] };

function toDescriptors(list: unknown): PublicKeyCredentialDescriptor[] | undefined {
	if (!Array.isArray(list)) return undefined;
	return (list as CredentialDescriptorJson[]).map((entry) => ({
		id: base64UrlToBuffer(entry.id),
		type: 'public-key',
		transports: entry.transports as AuthenticatorTransport[] | undefined
	}));
}

function manualCreationOptions(json: OptionsJson): PublicKeyCredentialCreationOptions {
	const pk = publicKeyOf(json);
	const user = pk.user as { id: string; name: string; displayName: string };
	return {
		...(pk as unknown as PublicKeyCredentialCreationOptions),
		challenge: base64UrlToBuffer(pk.challenge as string),
		user: { ...user, id: base64UrlToBuffer(user.id) },
		excludeCredentials: toDescriptors(pk.excludeCredentials)
	};
}

function manualRequestOptions(json: OptionsJson): PublicKeyCredentialRequestOptions {
	const pk = publicKeyOf(json);
	return {
		...(pk as unknown as PublicKeyCredentialRequestOptions),
		challenge: base64UrlToBuffer(pk.challenge as string),
		allowCredentials: toDescriptors(pk.allowCredentials)
	};
}

type CredentialWithJson = PublicKeyCredential & { toJSON?: () => unknown };

/**
 * Serializes an assertion/attestation into the JSON the backend's
 * `protocol.Parse*ResponseBytes` expects. Native `toJSON()` when the engine has
 * it, hand-rolled otherwise.
 */
function credentialToJson(credential: PublicKeyCredential): Record<string, unknown> {
	const withJson = credential as CredentialWithJson;
	if (typeof withJson.toJSON === 'function') {
		return withJson.toJSON() as unknown as Record<string, unknown>;
	}

	const response = credential.response;
	const out: Record<string, unknown> = {
		id: credential.id,
		rawId: bufferToBase64Url(credential.rawId),
		type: credential.type,
		clientExtensionResults: credential.getClientExtensionResults(),
		authenticatorAttachment: credential.authenticatorAttachment ?? undefined
	};

	if ('attestationObject' in response) {
		const attestation = response as AuthenticatorAttestationResponse;
		out.response = {
			clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
			attestationObject: bufferToBase64Url(attestation.attestationObject),
			transports: attestation.getTransports?.() ?? []
		};
		return out;
	}

	const assertion = response as AuthenticatorAssertionResponse;
	out.response = {
		clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
		authenticatorData: bufferToBase64Url(assertion.authenticatorData),
		signature: bufferToBase64Url(assertion.signature),
		userHandle: assertion.userHandle ? bufferToBase64Url(assertion.userHandle) : null
	};
	return out;
}

type JsonCapablePublicKeyCredential = {
	parseCreationOptionsFromJSON?: (json: unknown) => PublicKeyCredentialCreationOptions;
	parseRequestOptionsFromJSON?: (json: unknown) => PublicKeyCredentialRequestOptions;
};

/** Registers a new authenticator. Returns the JSON to POST back to the server. */
export async function createCredential(options: OptionsJson): Promise<Record<string, unknown>> {
	const api = window.PublicKeyCredential as unknown as JsonCapablePublicKeyCredential;
	const publicKey = api.parseCreationOptionsFromJSON
		? api.parseCreationOptionsFromJSON(publicKeyOf(options))
		: manualCreationOptions(options);

	const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
	if (!credential) throw new Error('WebAuthn registration was cancelled');
	return credentialToJson(credential);
}

/** Runs an assertion. Returns the JSON to POST back to the server. */
export async function getAssertion(options: OptionsJson): Promise<Record<string, unknown>> {
	const api = window.PublicKeyCredential as unknown as JsonCapablePublicKeyCredential;
	const publicKey = api.parseRequestOptionsFromJSON
		? api.parseRequestOptionsFromJSON(publicKeyOf(options))
		: manualRequestOptions(options);

	const credential = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
	if (!credential) throw new Error('WebAuthn assertion was cancelled');
	return credentialToJson(credential);
}

/** Exposed for tests only. */
export const __internal = { base64UrlToBuffer, bufferToBase64Url, manualCreationOptions, manualRequestOptions };
