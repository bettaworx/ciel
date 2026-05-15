export const DEFAULT_API_BASE_URL = 'http://localhost:6137';
export const API_PATH_PREFIX = '/api/v1';
export const RUNTIME_CONFIG_SCRIPT_ID = '__CIEL_RUNTIME_CONFIG__';

export type RuntimeConfig = {
	apiBaseUrl?: string;
};

type RuntimeConfigCandidate = {
	apiBaseUrl?: unknown;
};

export function cleanBaseUrl(value?: string | null, fallback = DEFAULT_API_BASE_URL): string {
	const raw = (value ?? fallback).trim();
	const base = raw || fallback;
	return base.replace(/\/+$/, '');
}

export function normalizeApiBaseUrl(value?: string | null): string {
	const base = cleanBaseUrl(value);

	if (base === API_PATH_PREFIX || base.endsWith(API_PATH_PREFIX)) {
		return base;
	}

	if (/^https?:\/\//.test(base) || base.startsWith('/')) {
		return `${base}${API_PATH_PREFIX}`;
	}

	return base;
}

export function backendOriginFromBaseUrl(value?: string | null): string {
	const base = cleanBaseUrl(value);

	try {
		return new URL(base).origin;
	} catch {
		if (base === API_PATH_PREFIX) return '/';
		if (base.endsWith(API_PATH_PREFIX)) {
			const withoutApiPath = base.slice(0, -API_PATH_PREFIX.length);
			return withoutApiPath || '/';
		}
		return base;
	}
}

function parseRuntimeConfig(value: string): RuntimeConfig {
	try {
		const parsed = JSON.parse(value) as RuntimeConfigCandidate;
		return typeof parsed.apiBaseUrl === 'string'
			? { apiBaseUrl: parsed.apiBaseUrl }
			: {};
	} catch {
		return {};
	}
}

export function getRuntimeConfig(): RuntimeConfig {
	if (typeof document === 'undefined') return {};

	const element = document.getElementById(RUNTIME_CONFIG_SCRIPT_ID);
	if (!element?.textContent) return {};

	return parseRuntimeConfig(element.textContent);
}

export function resolveApiBaseUrl(explicit?: string): string {
	return normalizeApiBaseUrl(
		explicit ?? getRuntimeConfig().apiBaseUrl ?? DEFAULT_API_BASE_URL,
	);
}

export function resolveWebSocketUrl(explicit?: string): string {
	const configuredBaseUrl = explicit ?? getRuntimeConfig().apiBaseUrl ?? DEFAULT_API_BASE_URL;
	const backendOrigin = backendOriginFromBaseUrl(configuredBaseUrl);
	const baseForUrl = /^https?:\/\//.test(backendOrigin)
		? backendOrigin
		: typeof window !== 'undefined'
			? window.location.origin
			: DEFAULT_API_BASE_URL;
	const url = new URL('/ws/events', baseForUrl);
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
	return url.toString();
}
