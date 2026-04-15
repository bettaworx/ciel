/**
 * In-memory sliding-window rate limiter.
 *
 * Tracks request timestamps per identifier (typically an IP address) and
 * enforces a maximum number of requests within a configurable time window.
 *
 * This is suitable for a single-process Next.js deployment. For multi-instance
 * setups, replace with a Redis-based limiter.
 */

interface WindowEntry {
	timestamps: number[];
}

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 30; // 30 requests per window
const CLEANUP_INTERVAL_MS = 5 * 60_000; // Run cleanup every 5 minutes

class RateLimiter {
	private store = new Map<string, WindowEntry>();
	private windowMs: number;
	private maxRequests: number;
	private cleanupTimer: ReturnType<typeof setInterval> | null = null;

	constructor(windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS) {
		this.windowMs = windowMs;
		this.maxRequests = maxRequests;
		this.startCleanup();
	}

	/**
	 * Check whether the identifier is allowed to make a request.
	 * Returns `true` if allowed, `false` if rate-limited.
	 *
	 * When `true`, the request is also recorded.
	 */
	check(identifier: string): boolean {
		const now = Date.now();
		const cutoff = now - this.windowMs;

		let entry = this.store.get(identifier);
		if (!entry) {
			entry = { timestamps: [] };
			this.store.set(identifier, entry);
		}

		// Remove timestamps outside the current window.
		entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

		if (entry.timestamps.length >= this.maxRequests) {
			return false;
		}

		entry.timestamps.push(now);
		return true;
	}

	/**
	 * Periodically evict stale entries to prevent unbounded memory growth.
	 */
	private startCleanup(): void {
		// Avoid duplicate intervals (e.g. in hot-reload scenarios).
		if (this.cleanupTimer) return;

		this.cleanupTimer = setInterval(() => {
			const now = Date.now();
			const cutoff = now - this.windowMs;

			for (const [key, entry] of this.store) {
				entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
				if (entry.timestamps.length === 0) {
					this.store.delete(key);
				}
			}
		}, CLEANUP_INTERVAL_MS);

		// Allow the process to exit naturally even if the interval is running.
		if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
			this.cleanupTimer.unref();
		}
	}
}

// ---------------------------------------------------------------------------
// Singleton instances – survive across API route invocations within the
// same Next.js server process.
// ---------------------------------------------------------------------------

/** Rate limiter for OGP metadata fetches (30 req/min per IP). */
export const ogpRateLimiter = new RateLimiter(DEFAULT_WINDOW_MS, DEFAULT_MAX_REQUESTS);

/** Rate limiter for image proxy requests (60 req/min per IP – more lenient). */
export const imageProxyRateLimiter = new RateLimiter(DEFAULT_WINDOW_MS, 60);

/**
 * Extract a client identifier from a request.
 * Prefers X-Forwarded-For (first entry) when behind a reverse proxy.
 */
export function getClientIdentifier(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		// X-Forwarded-For: client, proxy1, proxy2
		const first = forwarded.split(',')[0].trim();
		if (first) return first;
	}

	// Fallback — not ideal but better than nothing.
	return 'unknown';
}
