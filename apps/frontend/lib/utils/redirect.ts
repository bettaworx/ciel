/**
 * Validates that a redirect URL is safe (same-origin or relative path).
 * Prevents open redirect vulnerabilities (CWE-601).
 *
 * @param url - The URL to validate
 * @returns true if the URL is safe to redirect to
 */
export function isValidRedirect(url: string | null): boolean {
  if (!url || url.startsWith("//")) return false;

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
 * The returned value is canonicalized to a same-origin relative URL.
 *
 * @param url - The URL to validate
 * @param fallback - The fallback URL if validation fails (default: '/')
 * @returns A safe redirect URL
 */
export function getSafeRedirect(url: string | null, fallback: string = "/"): string {
  if (!url || url.startsWith("//")) return fallback;

  try {
    const redirectUrl = new URL(url, window.location.origin);
    if (redirectUrl.origin !== window.location.origin) return fallback;

    return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  } catch {
    return fallback;
  }
}
