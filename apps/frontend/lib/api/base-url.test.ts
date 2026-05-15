import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	RUNTIME_CONFIG_SCRIPT_ID,
	backendOriginFromBaseUrl,
	normalizeApiBaseUrl,
	resolveApiBaseUrl,
	resolveWebSocketUrl,
} from '@/lib/api/base-url';

function stubRuntimeConfig(config: unknown) {
	vi.stubGlobal('document', {
		getElementById: (id: string) =>
			id === RUNTIME_CONFIG_SCRIPT_ID
				? { textContent: JSON.stringify(config) }
				: null,
	});
}

describe('API base URL resolution', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('defaults to the independent backend port', () => {
		expect(resolveApiBaseUrl()).toBe('http://localhost:6137/api/v1');
	});

	it('adds /api/v1 to an origin', () => {
		expect(normalizeApiBaseUrl('http://example.test:6137')).toBe(
			'http://example.test:6137/api/v1',
		);
	});

	it('does not add /api/v1 twice', () => {
		expect(normalizeApiBaseUrl('http://example.test:6137/api/v1')).toBe(
			'http://example.test:6137/api/v1',
		);
	});

	it('uses runtime config injected by the Next.js server', () => {
		stubRuntimeConfig({ apiBaseUrl: 'http://api.example.test:6137' });

		expect(resolveApiBaseUrl()).toBe('http://api.example.test:6137/api/v1');
	});

	it('derives backend origin from an API URL', () => {
		expect(backendOriginFromBaseUrl('http://api.example.test:6137/api/v1')).toBe(
			'http://api.example.test:6137',
		);
	});

	it('builds WebSocket URLs from the backend API URL', () => {
		stubRuntimeConfig({ apiBaseUrl: 'https://api.example.test:9443/api/v1' });

		expect(resolveWebSocketUrl()).toBe('wss://api.example.test:9443/ws/events');
	});
});
