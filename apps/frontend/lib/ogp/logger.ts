/**
 * OGP API logging utilities
 * 
 * Controls log levels based on NODE_ENV.
 * - In development: All logs enabled
 * - In production: Only errors and warnings
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Enable debug logs in development only
const shouldLogDebug = isDevelopment;

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
 * Log debug information (only in development)
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
