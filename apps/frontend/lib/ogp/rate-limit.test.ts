import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test RateLimiter in isolation, so we import the class behavior
// through the exported instances and getClientIdentifier.
// Since the module exports singleton instances, we test the behavior directly.

describe('RateLimiter', () => {
	// We'll create fresh instances for testing by importing the module
	// and testing via the exported singletons' behavior pattern.
	// Instead, let's test the logic by re-implementing the check.

	// Actually, let's just test the exported singletons.
	// The ogpRateLimiter allows 30 req/min, imageProxyRateLimiter allows 60 req/min.

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('ogpRateLimiter allows up to 30 requests per minute', async () => {
		// Dynamic import to get fresh module state isn't possible with singletons,
		// but we can test with unique identifiers per test.
		const { ogpRateLimiter } = await import('@/lib/ogp/rate-limit');
		const id = `test-ogp-${crypto.randomUUID()}`;

		for (let i = 0; i < 30; i++) {
			expect(ogpRateLimiter.check(id)).toBe(true);
		}
		// 31st should be rejected
		expect(ogpRateLimiter.check(id)).toBe(false);
	});

	it('imageProxyRateLimiter allows up to 60 requests per minute', async () => {
		const { imageProxyRateLimiter } = await import('@/lib/ogp/rate-limit');
		const id = `test-img-${crypto.randomUUID()}`;

		for (let i = 0; i < 60; i++) {
			expect(imageProxyRateLimiter.check(id)).toBe(true);
		}
		// 61st should be rejected
		expect(imageProxyRateLimiter.check(id)).toBe(false);
	});

	it('resets after the window expires', async () => {
		const { ogpRateLimiter } = await import('@/lib/ogp/rate-limit');
		const id = `test-reset-${crypto.randomUUID()}`;

		// Exhaust the limit
		for (let i = 0; i < 30; i++) {
			ogpRateLimiter.check(id);
		}
		expect(ogpRateLimiter.check(id)).toBe(false);

		// Advance time past the 1-minute window
		vi.advanceTimersByTime(61_000);

		// Should be allowed again
		expect(ogpRateLimiter.check(id)).toBe(true);
	});

	it('tracks different identifiers independently', async () => {
		const { ogpRateLimiter } = await import('@/lib/ogp/rate-limit');
		const id1 = `test-a-${crypto.randomUUID()}`;
		const id2 = `test-b-${crypto.randomUUID()}`;

		// Exhaust id1
		for (let i = 0; i < 30; i++) {
			ogpRateLimiter.check(id1);
		}
		expect(ogpRateLimiter.check(id1)).toBe(false);

		// id2 should still be allowed
		expect(ogpRateLimiter.check(id2)).toBe(true);
	});
});

describe('getClientIdentifier', () => {
	it('extracts first IP from X-Forwarded-For', async () => {
		const { getClientIdentifier } = await import('@/lib/ogp/rate-limit');
		const request = new Request('http://localhost', {
			headers: { 'X-Forwarded-For': '1.2.3.4, 5.6.7.8' },
		});
		expect(getClientIdentifier(request)).toBe('1.2.3.4');
	});

	it('handles single IP in X-Forwarded-For', async () => {
		const { getClientIdentifier } = await import('@/lib/ogp/rate-limit');
		const request = new Request('http://localhost', {
			headers: { 'X-Forwarded-For': '1.2.3.4' },
		});
		expect(getClientIdentifier(request)).toBe('1.2.3.4');
	});

	it('falls back to "unknown" without X-Forwarded-For', async () => {
		const { getClientIdentifier } = await import('@/lib/ogp/rate-limit');
		const request = new Request('http://localhost');
		expect(getClientIdentifier(request)).toBe('unknown');
	});
});
