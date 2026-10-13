/**
 * Pattern matching x.com / twitter.com tweet URLs:
 *   - https://x.com/username/status/1234567890123456789
 *   - https://twitter.com/username/status/1234567890123456789
 *   - https://www.x.com/username/status/...
 *   - https://mobile.twitter.com/username/status/...
 *
 * Captures: [1] = username, [2] = tweetId
 */
const TWITTER_URL_RE =
  /^https?:\/\/(?:(?:www|mobile)\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)(?=[?#]|$)/i;

/**
 * If the URL points to a tweet, returns `{ username, tweetId }`.
 * Otherwise returns `null`.
 */
export function parseTwitterUrl(url: string): { username: string; tweetId: string } | null {
  const m = TWITTER_URL_RE.exec(url);
  if (!m) return null;
  return { username: m[1], tweetId: m[2] };
}

/**
 * Returns the canonical X URL for a tweet.
 */
export function getTwitterCanonicalUrl({
  username,
  tweetId,
}: {
  username: string;
  tweetId: string;
}): string {
  return `https://x.com/${username}/status/${tweetId}`;
}
