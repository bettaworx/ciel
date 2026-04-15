import { NextResponse } from 'next/server';
import { safeFetch } from '@/lib/ogp/ssrf';
import { parseOgp } from '@/lib/ogp/parse-ogp';
import { ogpRateLimiter, getClientIdentifier } from '@/lib/ogp/rate-limit';
import { fetchTwitterOgp, parseTweetUrl } from '@/lib/ogp/twitter';
import { logDebug, logWarn, logError, getDomain, sanitizeUrl } from '@/lib/ogp/logger';
import type { OgpApiResponse } from '@/lib/ogp/types';

export const runtime = 'nodejs';

/** Maximum HTML body size: 1 MiB */
const MAX_HTML_SIZE = 1024 * 1024;

export async function GET(request: Request): Promise<NextResponse<OgpApiResponse>> {
	try {
		// --- Rate limit ---
		const clientId = getClientIdentifier(request);
		if (!ogpRateLimiter.check(clientId)) {
			return NextResponse.json(
				{ error: 'Rate limit exceeded' },
				{ status: 429, headers: { 'Retry-After': '60' } },
			);
		}

		// --- URL parameter ---
		const url = new URL(request.url).searchParams.get('url');
		if (!url) {
			return NextResponse.json({ error: 'Missing "url" query parameter' }, { status: 400 });
		}

		// Basic URL validation
		try {
			const parsed = new URL(url);
			if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
				return NextResponse.json(
					{ error: 'Only http/https URLs are allowed' },
					{ status: 400 },
				);
			}
		} catch {
			return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
		}

		// --- Twitter/X fast-path ---
		if (parseTweetUrl(url)) {
			try {
				const twitterOgp = await fetchTwitterOgp(url);
				if (twitterOgp) {
					logDebug('Twitter syndication API succeeded', {
						urlDomain: getDomain(url),
					});
					return NextResponse.json(
						{ data: twitterOgp },
						{
							headers: {
								'Cache-Control': 'public, max-age=86400, s-maxage=86400',
							},
						},
					);
				}
				// Syndication API failed – fall through to standard OGP fetch.
				// (x.com won't return OG tags either, but let's try anyway.)
			} catch (err) {
				logError('Twitter syndication failed, falling back', {
					error: err instanceof Error ? err.message : String(err),
					urlDomain: getDomain(url),
				});
			}
		}

		// --- Fetch the page ---
		logDebug('Fetching URL', {
			sanitizedUrl: sanitizeUrl(url),
			urlDomain: getDomain(url),
		});

		const result = await safeFetch(url, {
			allowedContentTypes: ['text/html', 'application/xhtml+xml'],
			maxBodySize: MAX_HTML_SIZE,
		});

		if (!result.ok) {
			logError('safeFetch failed', {
				reason: result.reason,
				status: result.status,
				urlDomain: getDomain(url),
			});
			const status = result.status ?? 502;
			return NextResponse.json({ error: result.reason }, { status });
		}

		logDebug('safeFetch succeeded', {
			finalUrlDomain: getDomain(result.finalUrl),
			contentType: result.response.headers.get('content-type'),
			wasRedirected: result.finalUrl !== url,
		});

		// --- Read body with size limit ---
		let html: string;
		try {
			const reader = result.response.body?.getReader();
			if (!reader) {
				logError('Empty response body');
				return NextResponse.json({ error: 'Empty response body' }, { status: 502 });
			}

			const chunks: Uint8Array[] = [];
			let totalSize = 0;

			// eslint-disable-next-line no-constant-condition
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				totalSize += value.byteLength;
				if (totalSize > MAX_HTML_SIZE) {
					reader.cancel();
					logWarn('HTML size exceeded limit', {
						totalSize,
						maxSize: MAX_HTML_SIZE,
						urlDomain: getDomain(url),
					});
					break;
				}
				chunks.push(value);
			}

			const decoder = new TextDecoder();
			html =
				chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('') +
				decoder.decode();

			logDebug('HTML read complete', {
				htmlLength: html.length,
				htmlPreview: html.slice(0, 100).replace(/\s+/g, ' '),
			});
		} catch (err) {
			logError('Failed to read response body', {
				error: err instanceof Error ? err.message : String(err),
				errorType: err?.constructor?.name,
			});
			return NextResponse.json({ error: 'Failed to read response' }, { status: 502 });
		}

		// --- Parse OGP ---
		const ogp = parseOgp(html, result.finalUrl);
		if (!ogp) {
			logWarn('No OGP metadata found', {
				urlDomain: getDomain(url),
				finalUrlDomain: getDomain(result.finalUrl),
				htmlLength: html.length,
				hasHtmlTag: html.toLowerCase().includes('<html'),
				hasTitleTag: html.toLowerCase().includes('<title'),
				hasMetaTags: html.toLowerCase().includes('<meta'),
				htmlSnippet: html.slice(0, 200).replace(/\s+/g, ' '),
			});
			return NextResponse.json({ error: 'No OGP metadata found' }, { status: 404 });
		}

		logDebug('Successfully parsed OGP data', {
			hasTitle: !!ogp.title,
			hasDescription: !!ogp.description,
			hasImage: !!ogp.image,
			hasSiteName: !!ogp.siteName,
			urlDomain: getDomain(url),
		});

		return NextResponse.json(
			{ data: ogp },
			{
				headers: {
					'Cache-Control': 'public, max-age=86400, s-maxage=86400',
				},
			},
		);
	} catch (err) {
		logError('Unhandled error in OGP route', {
			error: err instanceof Error ? err.message : String(err),
			errorType: err?.constructor?.name,
			stack: err instanceof Error ? err.stack : undefined,
		});
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
