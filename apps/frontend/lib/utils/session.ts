/**
 * Session expiration utilities for client-side session management.
 */

/**
 * Safety margin in milliseconds to discard sessions before they actually expire.
 * This accounts for clock skew between client and server.
 */
const SAFETY_MARGIN_MS = 30 * 1000; // 30 seconds

/**
 * Threshold in milliseconds before expiration to trigger token refresh.
 * Refresh when there's less than 5 minutes remaining.
 */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate server time offset from Date header in response.
 * 
 * @param dateHeader - The Date header value from server response
 * @returns Offset in milliseconds (serverTime - clientTime)
 */
export function calculateServerTimeOffset(dateHeader: string): number {
  const serverTime = new Date(dateHeader).getTime();
  const clientTime = Date.now();
  return serverTime - clientTime;
}

/**
 * Get current time adjusted for server time offset.
 * 
 * @param serverTimeOffset - Offset in milliseconds
 * @returns Adjusted current time in milliseconds
 */
export function getAdjustedNow(serverTimeOffset: number): number {
  return Date.now() + serverTimeOffset;
}

/**
 * Check if a session has expired (with safety margin).
 * 
 * @param expiresAt - Expiration timestamp in milliseconds (null means expired)
 * @param serverTimeOffset - Server time offset in milliseconds (default: 0)
 * @returns true if session is expired or about to expire
 */
export function isSessionExpired(
  expiresAt: number | null,
  serverTimeOffset = 0
): boolean {
  if (!expiresAt) return true;
  const now = getAdjustedNow(serverTimeOffset);
  return now + SAFETY_MARGIN_MS >= expiresAt;
}

/**
 * Check if a session should be refreshed soon.
 * 
 * @param expiresAt - Expiration timestamp in milliseconds (null means should refresh)
 * @param serverTimeOffset - Server time offset in milliseconds (default: 0)
 * @returns true if session should be refreshed
 */
export function shouldRefreshSession(
  expiresAt: number | null,
  serverTimeOffset = 0
): boolean {
  if (!expiresAt) return true;
  const now = getAdjustedNow(serverTimeOffset);
  return now + REFRESH_THRESHOLD_MS >= expiresAt;
}

/**
 * Calculate expiration timestamp from expiresInSeconds.
 * 
 * @param expiresInSeconds - Number of seconds until expiration
 * @param serverTimeOffset - Server time offset in milliseconds (default: 0)
 * @returns Expiration timestamp in milliseconds
 */
export function calculateExpiresAt(
  expiresInSeconds: number,
  serverTimeOffset = 0
): number {
  const now = getAdjustedNow(serverTimeOffset);
  return now + expiresInSeconds * 1000;
}
