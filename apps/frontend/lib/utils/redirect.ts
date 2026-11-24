/**
 * Returns a safe redirect target, defaulting to fallback if the URL is not
 * same-origin. Prevents open redirects (CWE-601): the result is rebuilt from
 * the parsed URL, so only a path/query/hash of our own origin can escape.
 *
 * @param url - The URL to validate
 * @param fallback - The fallback URL if validation fails (default: '/')
 * @returns A safe same-origin path
 */
export function getSafeRedirect(url: string | null, fallback: string = "/"): string {
  if (!url) return fallback;

  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) return fallback;
    // A same-origin URL can still yield a `//evil.com` pathname, which becomes a
    // protocol-relative redirect once assigned to location.href. Collapse it.
    return `${parsed.pathname.replace(/^\/+/, "/")}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
