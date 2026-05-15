import 'server-only';

import {
	DEFAULT_API_BASE_URL,
	backendOriginFromBaseUrl,
	cleanBaseUrl,
	normalizeApiBaseUrl,
} from '@/lib/api/base-url';

export function getPublicApiBaseUrl(): string {
	return cleanBaseUrl(process.env.API_BASE_URL, DEFAULT_API_BASE_URL);
}

export function getInternalApiBaseUrl(): string {
	return normalizeApiBaseUrl(
		process.env.INTERNAL_API_BASE_URL ?? process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
	);
}

export function getInternalBackendOrigin(): string {
	return backendOriginFromBaseUrl(
		process.env.INTERNAL_API_BASE_URL ?? process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
	);
}

function configuredPublicBackendOrigins(): Set<string> {
	const origins = [
		process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
		process.env.PUBLIC_BASE_URL,
	]
		.filter((value): value is string => Boolean(value))
		.map((value) => backendOriginFromBaseUrl(value));

	return new Set(origins);
}

export function rewriteBackendUrlForServerFetch(value: string): string {
	let target: URL;
	let internalOrigin: URL;

	try {
		target = new URL(value);
		internalOrigin = new URL(getInternalBackendOrigin());
	} catch {
		return value;
	}

	if (!configuredPublicBackendOrigins().has(target.origin)) {
		return value;
	}

	target.protocol = internalOrigin.protocol;
	target.host = internalOrigin.host;
	return target.toString();
}
