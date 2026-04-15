import * as cheerio from 'cheerio';
import { logWarn, getDomain } from '@/lib/ogp/logger';
import type { OgpData } from '@/lib/ogp/types';

/**
 * Parse OGP (Open Graph Protocol) metadata from an HTML string.
 *
 * Fallback priority:
 *   1. og:* meta tags  (Open Graph)
 *   2. twitter:* meta tags  (Twitter Card)
 *   3. Standard HTML elements (<title>, <meta name="description">)
 *
 * Returns `null` when no meaningful data could be extracted (no title found).
 */
export function parseOgp(html: string, pageUrl: string): OgpData | null {
	const $ = cheerio.load(html);

	// ---- Helpers for meta tag extraction ----

	function ogMeta(property: string): string | undefined {
		const content =
			$(`meta[property="${property}"]`).attr('content') ??
			$(`meta[name="${property}"]`).attr('content');
		return content?.trim() || undefined;
	}

	// ---- Extract with fallback chain ----

	const ogTitle = ogMeta('og:title');
	const twitterTitle = ogMeta('twitter:title');
	const htmlTitle = $('title').first().text().trim();
	
	const title =
		(ogTitle ??
		twitterTitle ??
		htmlTitle) ||
		undefined;

	const description =
		ogMeta('og:description') ??
		ogMeta('twitter:description') ??
		ogMeta('description');

	const image = ogMeta('og:image') ?? ogMeta('twitter:image');

	const imageWidthRaw = ogMeta('og:image:width') ?? ogMeta('twitter:image:width');
	const imageHeightRaw = ogMeta('og:image:height') ?? ogMeta('twitter:image:height');
	const imageWidth = imageWidthRaw ? parseInt(imageWidthRaw, 10) : undefined;
	const imageHeight = imageHeightRaw ? parseInt(imageHeightRaw, 10) : undefined;

	const siteName =
		ogMeta('og:site_name') ??
		ogMeta('twitter:site');

	const canonicalUrl =
		(ogMeta('og:url') ??
		$('link[rel="canonical"]').attr('href')?.trim()) ||
		undefined;

	// If we couldn't even find a title, there's nothing useful to show.
	if (!title) {
		logWarn('parseOgp: No title found', {
			ogTitle,
			twitterTitle,
			htmlTitle,
			metaTagCount: $('meta').length,
			pageUrlDomain: getDomain(pageUrl),
		});
		return null;
	}

	// ---- Normalise the OGP image URL to absolute ----

	let absoluteImage: string | undefined;
	if (image) {
		try {
			absoluteImage = new URL(image, pageUrl).href;
		} catch {
			// Malformed image URL – skip it.
			absoluteImage = undefined;
		}
	}

	return {
		title: truncate(title, 200),
		description: description ? truncate(description, 300) : undefined,
		image: absoluteImage,
		imageWidth: absoluteImage && imageWidth && !Number.isNaN(imageWidth) ? imageWidth : undefined,
		imageHeight: absoluteImage && imageHeight && !Number.isNaN(imageHeight) ? imageHeight : undefined,
		siteName: siteName ? truncate(siteName, 100) : undefined,
		url: canonicalUrl,
	};
}

/** Truncate a string to a maximum length, appending "..." if needed. */
function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return str.slice(0, maxLen - 1) + '\u2026';
}
