/**
 * OGP API logging utilities
 * 
 * Controls log levels based on NODE_ENV and NEXT_PUBLIC_OGP_DEBUG.
 * - In development: All logs enabled by default
 * - In production: Only errors and warnings by default (unless NEXT_PUBLIC_OGP_DEBUG=true)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.NEXT_PUBLIC_OGP_DEBUG === 'true';

// Enable debug logs in development or when explicitly enabled
const shouldLogDebug = isDevelopment || isDebugEnabled;

/**
 * Sanitize URL for logging - removes query parameters that might contain tokens
 */
export function sanitizeUrl(url: string): string {
	try {
		const parsed = new URL(url);
		// Return URL without search params
		return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
	} catch {
		// If URL parsing fails, just return domain if possible
		return url.split('?')[0];
	}
}

/**
 * Extract domain from URL for privacy-safe logging
 */
export function getDomain(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return 'invalid-url';
	}
}

/**
 * Log debug information (only in development or when NEXT_PUBLIC_OGP_DEBUG=true)
 */
export function logDebug(message: string, data?: Record<string, unknown>): void {
	if (shouldLogDebug) {
		console.log(`[OGP] ${message}`, data ?? '');
	}
}

/**
 * Log warning (always enabled)
 */
export function logWarn(message: string, data?: Record<string, unknown>): void {
	console.warn(`[OGP] ${message}`, data ?? '');
}

/**
 * Log error (always enabled)
 */
export function logError(message: string, data?: Record<string, unknown>): void {
	console.error(`[OGP] ${message}`, data ?? '');
}
