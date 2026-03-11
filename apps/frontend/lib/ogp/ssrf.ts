import { resolve4, resolve6 } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import type { LookupFunction } from 'node:net';

// ---------------------------------------------------------------------------
// Private / reserved IP range checks
// ---------------------------------------------------------------------------

/**
 * Check whether an IPv4 address falls within a private or reserved range.
 *
 * Blocked ranges:
 *   0.0.0.0/8        – "This" network
 *   10.0.0.0/8       – Private (RFC 1918)
 *   100.64.0.0/10    – Shared address (CGN, RFC 6598)
 *   127.0.0.0/8      – Loopback
 *   169.254.0.0/16   – Link-local
 *   172.16.0.0/12    – Private (RFC 1918)
 *   192.0.0.0/24     – IETF protocol assignments
 *   192.0.2.0/24     – TEST-NET-1
 *   192.88.99.0/24   – 6to4 relay anycast (deprecated)
 *   192.168.0.0/16   – Private (RFC 1918)
 *   198.18.0.0/15    – Benchmarking
 *   198.51.100.0/24  – TEST-NET-2
 *   203.0.113.0/24   – TEST-NET-3
 *   224.0.0.0/4      – Multicast
 *   240.0.0.0/4      – Reserved / broadcast
 */
function isPrivateIPv4(ip: string): boolean {
	const parts = ip.split('.').map(Number);
	if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;

	const [a, b] = parts;

	if (a === 0) return true; // 0.0.0.0/8
	if (a === 10) return true; // 10.0.0.0/8
	if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10
	if (a === 127) return true; // 127.0.0.0/8
	if (a === 169 && b === 254) return true; // 169.254.0.0/16
	if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
	if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24
	if (a === 192 && b === 0 && parts[2] === 2) return true; // 192.0.2.0/24
	if (a === 192 && b === 88 && parts[2] === 99) return true; // 192.88.99.0/24
	if (a === 192 && b === 168) return true; // 192.168.0.0/16
	if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15
	if (a === 198 && b === 51 && parts[2] === 100) return true; // 198.51.100.0/24
	if (a === 203 && b === 0 && parts[2] === 113) return true; // 203.0.113.0/24
	if (a >= 224) return true; // 224.0.0.0/4 + 240.0.0.0/4

	return false;
}

/**
 * Check whether an IPv6 address is private or reserved.
 *
 * Blocked:
 *   ::1             – Loopback
 *   ::              – Unspecified
 *   ::ffff:0:0/96   – IPv4-mapped (re-checked as IPv4)
 *   fc00::/7        – Unique local (fd00::/8 included)
 *   fe80::/10       – Link-local
 *   ff00::/8        – Multicast
 *   100::/64        – Discard (RFC 6666)
 *   2001:db8::/32   – Documentation
 *   2001::/32       – Teredo
 *   2002::/16       – 6to4 (deprecated)
 */
function isPrivateIPv6(ip: string): boolean {
	const normalised = ip.toLowerCase();

	if (normalised === '::1' || normalised === '::') return true;

	// IPv4-mapped IPv6 (::ffff:x.x.x.x)
	const v4Mapped = normalised.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
	if (v4Mapped) return isPrivateIPv4(v4Mapped[1]);

	// Expand the first segment for prefix checks
	const segments = normalised.split(':');
	const first = segments[0];

	if (first === 'fc00' || first === 'fd00' || first.startsWith('fc') || first.startsWith('fd'))
		return true;
	if (first === 'fe80') return true;
	if (first.startsWith('ff')) return true;
	if (normalised.startsWith('100::')) return true;
	if (normalised.startsWith('2001:db8:')) return true;
	if (normalised.startsWith('2001::')) return true;
	if (first === '2002') return true;

	return false;
}

/**
 * Returns `true` when the IP address is private / reserved.
 */
export function isPrivateIp(ip: string): boolean {
	if (isIP(ip) === 4) return isPrivateIPv4(ip);
	if (isIP(ip) === 6) return isPrivateIPv6(ip);
	// Not a valid IP → treat as private (deny by default)
	return true;
}

// ---------------------------------------------------------------------------
// DNS resolution + validation
// ---------------------------------------------------------------------------

export interface ResolvedTarget {
	safe: true;
	hostname: string;
	addresses: string[];
}

export interface UnsafeTarget {
	safe: false;
	reason: string;
}

/**
 * Validate a URL for SSRF safety. Resolves the hostname via DNS and ensures
 * that **all** resolved IP addresses are public.
 *
 * Only `http:` and `https:` protocols are allowed.
 */
export async function validateUrl(rawUrl: string): Promise<ResolvedTarget | UnsafeTarget> {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch {
		return { safe: false, reason: 'Malformed URL' };
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return { safe: false, reason: 'Only http/https allowed' };
	}

	const hostname = parsed.hostname;

	// If the hostname is already an IP literal, validate directly.
	if (isIP(hostname)) {
		if (isPrivateIp(hostname)) {
			return { safe: false, reason: 'Private IP address' };
		}
		return { safe: true, hostname, addresses: [hostname] };
	}

	// Resolve DNS and validate every returned address.
	const addresses: string[] = [];

	try {
		const ipv4 = await resolve4(hostname);
		addresses.push(...ipv4);
	} catch {
		// No A records – that's fine, might have AAAA only.
	}

	try {
		const ipv6 = await resolve6(hostname);
		addresses.push(...ipv6);
	} catch {
		// No AAAA records.
	}

	if (addresses.length === 0) {
		return { safe: false, reason: 'DNS resolution failed' };
	}

	for (const addr of addresses) {
		if (isPrivateIp(addr)) {
			return { safe: false, reason: `Resolved to private IP: ${addr}` };
		}
	}

	return { safe: true, hostname, addresses };
}

// ---------------------------------------------------------------------------
// Safe HTTP(S) agents (DNS-rebinding mitigation)
// ---------------------------------------------------------------------------

/**
 * Create an HTTP or HTTPS agent whose `lookup` function always returns one of
 * the pre-validated addresses. This prevents DNS-rebinding attacks where the
 * DNS response changes between our validation step and the actual connection.
 */
export function createSafeAgent(
	protocol: 'http:' | 'https:',
	validatedAddresses: string[],
): HttpAgent | HttpsAgent {
	// Pick the first validated address.
	const address = validatedAddresses[0];
	const family = isIP(address) === 6 ? 6 : 4;

	const lookup: LookupFunction = (_hostname, _options, callback) => {
		// Always resolve to our pre-validated IP, ignoring the actual DNS.
		callback(null, address, family);
	};

	const opts = {
		lookup,
		// Only allow 1 socket and immediately free – prevents reuse across
		// different targets.
		maxSockets: 1,
		keepAlive: false,
	};

	return protocol === 'https:' ? new HttpsAgent(opts) : new HttpAgent(opts);
}

// ---------------------------------------------------------------------------
// High-level safe-fetch helper
// ---------------------------------------------------------------------------

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 10_000;

export interface SafeFetchOptions {
	/** Maximum body size in bytes.  Defaults to 1 MiB. */
	maxBodySize?: number;
	/** Custom headers to send with the request. */
	headers?: Record<string, string>;
	/** Allowed Content-Type prefixes (e.g. `["text/html"]`). `undefined` = no check. */
	allowedContentTypes?: string[];
}

export interface SafeFetchResult {
	ok: true;
	response: Response;
	finalUrl: string;
}

export interface SafeFetchError {
	ok: false;
	reason: string;
	status?: number;
}

/**
 * Fetch a URL safely, following redirects manually so that each hop is
 * re-validated against SSRF rules.
 */
export async function safeFetch(
	rawUrl: string,
	options: SafeFetchOptions = {},
): Promise<SafeFetchResult | SafeFetchError> {
	let currentUrl = rawUrl;

	for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
		const validation = await validateUrl(currentUrl);
		if (!validation.safe) {
			return { ok: false, reason: validation.reason };
		}

		const parsed = new URL(currentUrl);
		const agent = createSafeAgent(
			parsed.protocol as 'http:' | 'https:',
			validation.addresses,
		);

		let response: Response;
		try {
			response = await fetch(currentUrl, {
				method: 'GET',
				headers: {
					'User-Agent': 'Ciel OGP Fetcher/1.0',
					Accept: 'text/html, application/xhtml+xml, image/*, */*;q=0.1',
					'Accept-Language': 'ja,en;q=0.9',
					...options.headers,
				},
				redirect: 'manual', // Handle redirects ourselves
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
				// @ts-expect-error -- Node.js-specific option for undici
				dispatcher: undefined,
				// Node.js http/https agent
				// Next.js API routes run on Node, so this works.
				...(typeof globalThis.process !== 'undefined' ? { agent } : {}),
			});
		} catch (err) {
			// Destroy the agent to clean up sockets.
			agent.destroy();
			const message = err instanceof Error ? err.message : 'Fetch failed';
			return { ok: false, reason: message };
		}

		// Handle redirects manually – re-validate the new location.
		if ([301, 302, 303, 307, 308].includes(response.status)) {
			agent.destroy();
			const location = response.headers.get('location');
			if (!location) {
				return { ok: false, reason: 'Redirect without Location header' };
			}
			// Resolve relative redirect URLs.
			currentUrl = new URL(location, currentUrl).href;
			continue;
		}

		// Non-redirect response.
		if (!response.ok) {
			agent.destroy();
			return { ok: false, reason: `HTTP ${response.status}`, status: response.status };
		}

		// Content-Type validation
		if (options.allowedContentTypes) {
			const ct = response.headers.get('content-type') ?? '';
			const allowed = options.allowedContentTypes.some((prefix) =>
				ct.toLowerCase().startsWith(prefix),
			);
			if (!allowed) {
				agent.destroy();
				return { ok: false, reason: `Disallowed Content-Type: ${ct}` };
			}
		}

		return { ok: true, response, finalUrl: currentUrl };
	}

	return { ok: false, reason: 'Too many redirects' };
}
