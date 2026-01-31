/**
 * Validates that a redirect URL is safe (same-origin or relative path).
 * Prevents open redirect vulnerabilities (CWE-601).
 *
 * @param url - The URL to validate
 * @returns true if the URL is safe to redirect to
 */
export function isValidRedirect(url: string | null): boolean {
  if (!url) return false;

  // Allow relative paths (but not protocol-relative URLs like //evil.com)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // For absolute URLs, check if they're same-origin
  try {
    const redirectUrl = new URL(url, window.location.origin);
    return redirectUrl.origin === window.location.origin;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Returns a safe redirect URL, defaulting to fallback if invalid.
 *
 * @param url - The URL to validate
 * @param fallback - The fallback URL if validation fails (default: '/')
 * @returns A safe redirect URL
 */
export function getSafeRedirect(
  url: string | null,
  fallback: string = '/'
): string {
  return isValidRedirect(url) ? url! : fallback;
}
