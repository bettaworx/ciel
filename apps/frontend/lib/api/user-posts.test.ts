import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApiClient } from '@/lib/api/client';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
	});
}

const emptyPage = { items: [], nextCursor: null };

describe('userPosts query string serialization', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('omits excludeForeignReplies when not set', async () => {
		const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
		vi.stubGlobal('fetch', fetchMock);

		const api = createApiClient({});
		await api.userPosts('alice');

		const calledUrl = String(fetchMock.mock.calls[0][0]);
		expect(calledUrl).toContain('/users/alice/posts');
		expect(calledUrl).not.toContain('excludeForeignReplies');
	});

	it('appends excludeForeignReplies=true when set', async () => {
		const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
		vi.stubGlobal('fetch', fetchMock);

		const api = createApiClient({});
		await api.userPosts('alice', { excludeForeignReplies: true });

		const calledUrl = String(fetchMock.mock.calls[0][0]);
		expect(calledUrl).toContain('excludeForeignReplies=true');
	});

	it('omits excludeForeignReplies when explicitly false', async () => {
		const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
		vi.stubGlobal('fetch', fetchMock);

		const api = createApiClient({});
		await api.userPosts('alice', { excludeForeignReplies: false });

		const calledUrl = String(fetchMock.mock.calls[0][0]);
		expect(calledUrl).not.toContain('excludeForeignReplies');
	});

	it('appends onlyReplies=true when set', async () => {
		const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
		vi.stubGlobal('fetch', fetchMock);

		const api = createApiClient({});
		await api.userPosts('alice', { onlyReplies: true });

		const calledUrl = String(fetchMock.mock.calls[0][0]);
		expect(calledUrl).toContain('onlyReplies=true');
		expect(calledUrl).not.toContain('excludeForeignReplies');
	});

	it('can combine excludeForeignReplies with other params', async () => {
		const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
		vi.stubGlobal('fetch', fetchMock);

		const api = createApiClient({});
		await api.userPosts('bob', { excludeForeignReplies: true, limit: 10, cursor: 'abc' });

		const calledUrl = String(fetchMock.mock.calls[0][0]);
		expect(calledUrl).toContain('excludeForeignReplies=true');
		expect(calledUrl).toContain('limit=10');
		expect(calledUrl).toContain('cursor=abc');
	});

	it('URL-encodes special characters in username', async () => {
		const fetchMock = vi.fn(async () => jsonResponse(emptyPage));
		vi.stubGlobal('fetch', fetchMock);

		const api = createApiClient({});
		await api.userPosts('alice bob', { excludeForeignReplies: true });

		const calledUrl = String(fetchMock.mock.calls[0][0]);
		expect(calledUrl).toContain('/users/alice%20bob/posts');
		expect(calledUrl).toContain('excludeForeignReplies=true');
	});
});
