import { safeFetch } from '@/lib/ogp/ssrf';
import type { OgpData } from '@/lib/ogp/types';

// ---------------------------------------------------------------------------
// Twitter / X URL detection
// ---------------------------------------------------------------------------

/**
 * Pattern matching tweet URLs:
 *   - https://twitter.com/<user>/status/<id>
 *   - https://x.com/<user>/status/<id>
 *   - https://mobile.twitter.com/<user>/status/<id>
 *   - https://mobile.x.com/<user>/status/<id>
 *
 * Captures: [1] = screen_name, [2] = tweet ID
 */
const TWEET_URL_RE =
	/^https?:\/\/(?:mobile\.)?(?:twitter\.com|x\.com)\/([^/?#]+)\/status\/(\d+)/i;

/**
 * If the URL points to a tweet, returns `{ screenName, tweetId }`.
 * Otherwise returns `null`.
 */
export function parseTweetUrl(url: string): { screenName: string; tweetId: string } | null {
	const m = TWEET_URL_RE.exec(url);
	if (!m) return null;
	return { screenName: m[1], tweetId: m[2] };
}

// ---------------------------------------------------------------------------
// Syndication API types (subset of the response we care about)
// ---------------------------------------------------------------------------

interface SyndicationUser {
	name?: string;
	screen_name?: string;
	profile_image_url_https?: string;
}

interface SyndicationMediaDetail {
	type?: string;
	media_url_https?: string;
}

interface SyndicationPhoto {
	url?: string;
	width?: number;
	height?: number;
}

interface SyndicationTweet {
	text?: string;
	user?: SyndicationUser;
	mediaDetails?: SyndicationMediaDetail[];
	photos?: SyndicationPhoto[];
	favorite_count?: number;
	created_at?: string;
}

// ---------------------------------------------------------------------------
// Fetch tweet data via Twitter's syndication API
// ---------------------------------------------------------------------------

const SYNDICATION_BASE = 'https://cdn.syndication.twimg.com/tweet-result';

/**
 * Fetch a tweet from Twitter's public syndication API.
 *
 * This endpoint does **not** require authentication and returns JSON with
 * tweet text, author info, and media details. It may return 404 for deleted,
 * protected, or very old tweets.
 */
export async function fetchTweetSyndication(tweetId: string): Promise<SyndicationTweet | null> {
	const url = `${SYNDICATION_BASE}?id=${encodeURIComponent(tweetId)}&token=0`;

	const result = await safeFetch(url, {
		allowedContentTypes: ['application/json', 'text/json'],
		headers: {
			Accept: 'application/json',
		},
	});

	if (!result.ok) {
		return null;
	}

	try {
		const text = await result.response.text();
		const data = JSON.parse(text) as SyndicationTweet;
		// Sanity check: the response should have at least __typename or text
		if (!data.text && !data.user) return null;
		return data;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Convert syndication data to OgpData
// ---------------------------------------------------------------------------

/**
 * Convert tweet syndication data to a standardised `OgpData` object
 * suitable for rendering in OgpCard.
 *
 * Title format: "<display name> (@screen_name)"
 * Description: tweet text
 * Image: first photo from the tweet (if any)
 * Site name: "X (Twitter)"
 */
export function tweetToOgpData(
	tweet: SyndicationTweet,
	originalUrl: string,
): OgpData {
	const user = tweet.user;
	const displayName = user?.name ?? user?.screen_name ?? 'Unknown';
	const handle = user?.screen_name ? `@${user.screen_name}` : '';

	const title = handle ? `${displayName} (${handle})` : displayName;

	// Use the first photo as the OGP image.
	// Prefer photos[].url (higher quality) over mediaDetails[].media_url_https.
	let image: string | undefined;
	if (tweet.photos && tweet.photos.length > 0) {
		image = tweet.photos[0].url;
	} else if (tweet.mediaDetails && tweet.mediaDetails.length > 0) {
		const firstPhoto = tweet.mediaDetails.find((m) => m.type === 'photo');
		image = firstPhoto?.media_url_https;
	}

	return {
		title: truncate(title, 200),
		description: tweet.text ? truncate(tweet.text, 300) : undefined,
		image,
		siteName: 'X (Twitter)',
		url: originalUrl,
	};
}

// ---------------------------------------------------------------------------
// Public high-level helper
// ---------------------------------------------------------------------------

/**
 * Attempt to fetch OGP data for a Twitter/X tweet URL.
 *
 * Returns `null` if the URL is not a tweet URL or if the syndication API
 * fails / returns 404.
 */
export async function fetchTwitterOgp(url: string): Promise<OgpData | null> {
	const parsed = parseTweetUrl(url);
	if (!parsed) return null;

	const tweet = await fetchTweetSyndication(parsed.tweetId);
	if (!tweet) return null;

	return tweetToOgpData(tweet, url);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return str.slice(0, maxLen - 1) + '\u2026';
}
