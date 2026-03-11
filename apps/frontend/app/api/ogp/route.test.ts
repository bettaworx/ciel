import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SafeFetchResult, SafeFetchError } from '@/lib/ogp/ssrf';

// ---------------------------------------------------------------------------
// Mocks – must be declared before module imports
// ---------------------------------------------------------------------------

// Mock safeFetch so we don't make real HTTP requests.
const mockSafeFetch = vi.fn<
	(...args: unknown[]) => Promise<SafeFetchResult | SafeFetchError>
>();

vi.mock('@/lib/ogp/ssrf', () => ({
	safeFetch: (...args: unknown[]) => mockSafeFetch(...args),
}));

// Mock rate limiter to always allow.
vi.mock('@/lib/ogp/rate-limit', () => ({
	ogpRateLimiter: { check: () => true },
	imageProxyRateLimiter: { check: () => true },
	getClientIdentifier: () => 'test-client',
}));

// Mock twitter module – control fetchTwitterOgp from tests.
const mockFetchTwitterOgp = vi.fn();

vi.mock('@/lib/ogp/twitter', async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, unknown>;
	return {
		...actual,
		fetchTwitterOgp: (...args: unknown[]) => mockFetchTwitterOgp(...args),
	};
});

// ---------------------------------------------------------------------------
// Helper to create a mock Response with HTML body
// ---------------------------------------------------------------------------

function makeHtmlResponse(html: string, headers?: Record<string, string>): Response {
	return new Response(html, {
		status: 200,
		headers: {
			'content-type': 'text/html; charset=utf-8',
			...headers,
		},
	});
}

function makeImageResponse(data: Uint8Array, contentType = 'image/png'): Response {
	return new Response(data, {
		status: 200,
		headers: {
			'content-type': contentType,
		},
	});
}

// ---------------------------------------------------------------------------
// OGP metadata route tests
// ---------------------------------------------------------------------------

describe('GET /api/ogp', () => {
	let GET: (request: Request) => Promise<Response>;

	beforeEach(async () => {
		mockSafeFetch.mockReset();
		mockFetchTwitterOgp.mockReset();
		// Dynamic import to pick up mocks
		const mod = await import('@/app/api/ogp/route');
		GET = mod.GET as unknown as (request: Request) => Promise<Response>;
	});

	it('returns 400 when url param is missing', async () => {
		const req = new Request('http://localhost/api/ogp');
		const res = await GET(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toMatch(/url/i);
	});

	it('returns 400 for non-http URL', async () => {
		const req = new Request('http://localhost/api/ogp?url=ftp://example.com');
		const res = await GET(req);
		expect(res.status).toBe(400);
	});

	it('returns 400 for invalid URL', async () => {
		const req = new Request('http://localhost/api/ogp?url=not-a-url');
		const res = await GET(req);
		expect(res.status).toBe(400);
	});

	it('returns OGP data for a valid page', async () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Test Page" />
				<meta property="og:description" content="A test" />
				<meta property="og:image" content="https://example.com/img.png" />
				<meta property="og:site_name" content="Example" />
			</head><body></body></html>
		`;
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeHtmlResponse(html),
			finalUrl: 'https://example.com/page',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://example.com/page',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toBeDefined();
		expect(body.data.title).toBe('Test Page');
		expect(body.data.description).toBe('A test');
		expect(body.data.image).toBe('https://example.com/img.png');
		expect(body.data.siteName).toBe('Example');
	});

	it('returns 404 when no OGP metadata is found', async () => {
		const html = '<html><head></head><body>Hello</body></html>';
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeHtmlResponse(html),
			finalUrl: 'https://example.com/empty',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://example.com/empty',
		);
		const res = await GET(req);
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.error).toMatch(/no ogp/i);
	});

	it('returns error when safeFetch fails (SSRF blocked)', async () => {
		mockSafeFetch.mockResolvedValue({
			ok: false,
			reason: 'Private IP address',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://evil.com',
		);
		const res = await GET(req);
		expect(res.status).toBe(502);
		const body = await res.json();
		expect(body.error).toBe('Private IP address');
	});

	it('returns error when safeFetch fails with status', async () => {
		mockSafeFetch.mockResolvedValue({
			ok: false,
			reason: 'HTTP 403',
			status: 403,
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://forbidden.com',
		);
		const res = await GET(req);
		expect(res.status).toBe(403);
	});

	it('returns proper cache-control header on success', async () => {
		const html = '<html><head><title>Cached</title></head></html>';
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeHtmlResponse(html),
			finalUrl: 'https://example.com',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://example.com',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(res.headers.get('cache-control')).toContain('max-age=86400');
	});

	it('handles response with empty body', async () => {
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: new Response(null, {
				status: 200,
				headers: { 'content-type': 'text/html' },
			}),
			finalUrl: 'https://example.com',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://example.com',
		);
		const res = await GET(req);
		// Should handle gracefully — either 502 (empty body) or 404 (no OGP)
		expect([404, 502]).toContain(res.status);
	});

	// --- Twitter/X fast-path tests ---

	it('returns Twitter OGP data via syndication API for x.com tweet URL', async () => {
		mockFetchTwitterOgp.mockResolvedValue({
			title: 'jack (@jack)',
			description: 'just setting up my twttr',
			image: undefined,
			siteName: 'X (Twitter)',
			url: 'https://x.com/jack/status/20',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://x.com/jack/status/20',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toBeDefined();
		expect(body.data.title).toBe('jack (@jack)');
		expect(body.data.siteName).toBe('X (Twitter)');
		// safeFetch should NOT have been called since Twitter fast-path succeeded
		expect(mockSafeFetch).not.toHaveBeenCalled();
	});

	it('returns Twitter OGP data for twitter.com tweet URL', async () => {
		mockFetchTwitterOgp.mockResolvedValue({
			title: 'Barack Obama (@BarackObama)',
			description: 'Four more years.',
			image: 'https://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg',
			siteName: 'X (Twitter)',
			url: 'https://twitter.com/BarackObama/status/266031293945503744',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://twitter.com/BarackObama/status/266031293945503744',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.image).toBe('https://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg');
	});

	it('falls back to standard OGP when Twitter syndication fails', async () => {
		mockFetchTwitterOgp.mockResolvedValue(null);
		// x.com won't return useful OGP, but test that the fallback mechanism works
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeHtmlResponse('<html><head><title>X</title></head></html>'),
			finalUrl: 'https://x.com/user/status/999',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://x.com/user/status/999',
		);
		const res = await GET(req);
		// Should fall through to standard OGP – will get "X" as title
		expect(res.status).toBe(200);
		expect(mockSafeFetch).toHaveBeenCalled();
	});

	it('falls back to standard OGP when Twitter syndication throws', async () => {
		mockFetchTwitterOgp.mockRejectedValue(new Error('Network error'));
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeHtmlResponse('<html><head><title>Fallback</title></head></html>'),
			finalUrl: 'https://x.com/user/status/888',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://x.com/user/status/888',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(mockSafeFetch).toHaveBeenCalled();
	});

	it('does not use Twitter fast-path for non-tweet URLs', async () => {
		const html = '<html><head><meta property="og:title" content="Normal Site" /></head></html>';
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeHtmlResponse(html),
			finalUrl: 'https://example.com/page',
		});

		const req = new Request(
			'http://localhost/api/ogp?url=https://example.com/page',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(mockFetchTwitterOgp).not.toHaveBeenCalled();
		expect(mockSafeFetch).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Image proxy route tests
// ---------------------------------------------------------------------------

describe('GET /api/ogp/image', () => {
	let GET: (request: Request) => Promise<Response>;

	beforeEach(async () => {
		mockSafeFetch.mockReset();
		const mod = await import('@/app/api/ogp/image/route');
		GET = mod.GET as unknown as (request: Request) => Promise<Response>;
	});

	it('returns 400 when url param is missing', async () => {
		const req = new Request('http://localhost/api/ogp/image');
		const res = await GET(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toMatch(/url/i);
	});

	it('returns 400 for non-http URL', async () => {
		const req = new Request(
			'http://localhost/api/ogp/image?url=data:image/png;base64,abc',
		);
		const res = await GET(req);
		expect(res.status).toBe(400);
	});

	it('proxies an image successfully', async () => {
		const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG magic
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeImageResponse(imageData, 'image/png'),
			finalUrl: 'https://example.com/img.png',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/img.png',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('image/png');
		expect(res.headers.get('x-content-type-options')).toBe('nosniff');
		expect(res.headers.get('cache-control')).toContain('immutable');

		const body = new Uint8Array(await res.arrayBuffer());
		expect(body).toEqual(imageData);
	});

	it('preserves content-type from upstream (webp, jpeg, etc.)', async () => {
		const data = new Uint8Array([0xff, 0xd8, 0xff]); // JPEG magic
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeImageResponse(data, 'image/jpeg'),
			finalUrl: 'https://example.com/photo.jpg',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/photo.jpg',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('image/jpeg');
	});

	it('returns error when safeFetch fails', async () => {
		mockSafeFetch.mockResolvedValue({
			ok: false,
			reason: 'Resolved to private IP: 127.0.0.1',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://evil.internal/img.png',
		);
		const res = await GET(req);
		expect(res.status).toBe(502);
	});

	it('returns 502 when upstream response has no body', async () => {
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: new Response(null, {
				status: 200,
				headers: { 'content-type': 'image/png' },
			}),
			finalUrl: 'https://example.com/empty.png',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/empty.png',
		);
		const res = await GET(req);
		expect(res.status).toBe(502);
		const body = await res.json();
		expect(body.error).toMatch(/empty/i);
	});

	it('returns correct Content-Length header', async () => {
		const data = new Uint8Array(1024);
		for (let i = 0; i < data.length; i++) data[i] = i % 256;

		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeImageResponse(data, 'image/png'),
			finalUrl: 'https://example.com/img.png',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/img.png',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-length')).toBe('1024');
	});

	it('returns 413 when image exceeds size limit (5 MiB)', async () => {
		// Create a response that streams more than 5 MiB
		const oversizedData = new Uint8Array(6 * 1024 * 1024); // 6 MiB

		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeImageResponse(oversizedData, 'image/png'),
			finalUrl: 'https://example.com/huge.png',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/huge.png',
		);
		const res = await GET(req);
		expect(res.status).toBe(413);
		const body = await res.json();
		expect(body.error).toMatch(/too large/i);
	});

	it('defaults content-type to image/png when upstream omits it', async () => {
		const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: new Response(data, {
				status: 200,
				// No content-type header
			}),
			finalUrl: 'https://example.com/noct.png',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/noct.png',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);
		// The route falls back to 'image/png' when content-type is missing
		expect(res.headers.get('content-type')).toBe('image/png');
	});

	it('handles binary image data correctly (no corruption)', async () => {
		// Create data with all possible byte values
		const data = new Uint8Array(256);
		for (let i = 0; i < 256; i++) data[i] = i;

		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeImageResponse(data, 'image/png'),
			finalUrl: 'https://example.com/binary.png',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/binary.png',
		);
		const res = await GET(req);
		expect(res.status).toBe(200);

		const result = new Uint8Array(await res.arrayBuffer());
		expect(result.length).toBe(256);
		for (let i = 0; i < 256; i++) {
			expect(result[i]).toBe(i);
		}
	});

	it('retries on 429 error with exponential backoff (succeeds on 2nd attempt)', async () => {
		vi.useFakeTimers();

		const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

		// First call returns 429, second call succeeds
		mockSafeFetch
			.mockResolvedValueOnce({
				ok: false,
				reason: 'HTTP 429',
				status: 429,
			})
			.mockResolvedValueOnce({
				ok: true,
				response: makeImageResponse(imageData, 'image/png'),
				finalUrl: 'https://example.com/rate-limited.png',
			});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/rate-limited.png',
		);

		const responsePromise = GET(req);

		// Fast-forward 1 second (initial backoff)
		await vi.advanceTimersByTimeAsync(1000);

		const res = await responsePromise;

		expect(res.status).toBe(200);
		expect(mockSafeFetch).toHaveBeenCalledTimes(2);

		vi.useRealTimers();
	});

	it('retries on 429 error up to 3 times then returns 429', async () => {
		vi.useFakeTimers();

		// All attempts return 429
		mockSafeFetch.mockResolvedValue({
			ok: false,
			reason: 'HTTP 429',
			status: 429,
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://github.com/rate-limited.png',
		);

		const responsePromise = GET(req);

		// Fast-forward through all retries (1s + 2s + 4s = 7s total)
		await vi.advanceTimersByTimeAsync(7000);

		const res = await responsePromise;

		expect(res.status).toBe(429);
		// 1 initial + 3 retries = 4 total calls
		expect(mockSafeFetch).toHaveBeenCalledTimes(4);

		vi.useRealTimers();
	});

	it('does not retry on non-429 errors', async () => {
		mockSafeFetch.mockResolvedValue({
			ok: false,
			reason: 'HTTP 404',
			status: 404,
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/notfound.png',
		);
		const res = await GET(req);

		expect(res.status).toBe(404);
		// Should only be called once (no retries)
		expect(mockSafeFetch).toHaveBeenCalledTimes(1);
	});

	it('uses 7-day cache for successful image responses', async () => {
		const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		mockSafeFetch.mockResolvedValue({
			ok: true,
			response: makeImageResponse(imageData, 'image/png'),
			finalUrl: 'https://example.com/cached.png',
		});

		const req = new Request(
			'http://localhost/api/ogp/image?url=https://example.com/cached.png',
		);
		const res = await GET(req);

		expect(res.status).toBe(200);
		const cacheControl = res.headers.get('cache-control');
		expect(cacheControl).toContain('max-age=604800'); // 7 days
		expect(cacheControl).toContain('immutable');
	});
});
