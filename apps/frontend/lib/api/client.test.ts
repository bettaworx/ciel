import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@/lib/api/client';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			'content-type': 'application/json',
			...(init.headers ?? {}),
		},
	});
}

describe('createApiClient session refresh', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shares a single refresh request across concurrent clients', async () => {
		let timelineRequests = 0;
		const onSessionExpired = vi.fn();
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);

			if (url.endsWith('/auth/refresh')) {
				return jsonResponse({ expiresInSeconds: 3600 });
			}

			if (url.endsWith('/timeline')) {
				timelineRequests += 1;
				if (timelineRequests <= 2) {
					return jsonResponse({ code: 'unauthorized', message: 'expired' }, { status: 401 });
				}
				return jsonResponse({ items: [], nextCursor: null });
			}

			return jsonResponse({ code: 'not_found', message: 'not found' }, { status: 404 });
		});
		vi.stubGlobal('fetch', fetchMock);

		const clientA = createApiClient({ onSessionExpired });
		const clientB = createApiClient({ onSessionExpired });

		const [resultA, resultB] = await Promise.all([
			clientA.requestRaw('GET', '/timeline'),
			clientB.requestRaw('GET', '/timeline'),
		]);

		const refreshCalls = fetchMock.mock.calls.filter(([input]) =>
			String(input).endsWith('/auth/refresh'),
		);

		expect(resultA.ok).toBe(true);
		expect(resultB.ok).toBe(true);
		expect(refreshCalls).toHaveLength(1);
		expect(onSessionExpired).not.toHaveBeenCalled();
	});
});
