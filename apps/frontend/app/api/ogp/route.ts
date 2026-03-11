import { NextRequest, NextResponse } from 'next/server';
import { safeFetch } from '@/lib/ogp/ssrf';
import { parseOgp } from '@/lib/ogp/parse-ogp';
import { ogpRateLimiter, getClientIdentifier } from '@/lib/ogp/rate-limit';
import type { OgpApiResponse } from '@/lib/ogp/types';

export const runtime = 'nodejs';

/** Maximum HTML body size: 1 MiB */
const MAX_HTML_SIZE = 1024 * 1024;

export async function GET(request: NextRequest): Promise<NextResponse<OgpApiResponse>> {
	// --- Rate limit ---
	const clientId = getClientIdentifier(request);
	if (!ogpRateLimiter.check(clientId)) {
		return NextResponse.json(
			{ error: 'Rate limit exceeded' },
			{ status: 429, headers: { 'Retry-After': '60' } },
		);
	}

	// --- URL parameter ---
	const url = request.nextUrl.searchParams.get('url');
	if (!url) {
		return NextResponse.json({ error: 'Missing "url" query parameter' }, { status: 400 });
	}

	// Basic URL validation
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
		}
	} catch {
		return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
	}

	// --- Fetch the page ---
	const result = await safeFetch(url, {
		allowedContentTypes: ['text/html', 'application/xhtml+xml'],
		maxBodySize: MAX_HTML_SIZE,
	});

	if (!result.ok) {
		const status = result.status ?? 502;
		return NextResponse.json({ error: result.reason }, { status });
	}

	// --- Read body with size limit ---
	let html: string;
	try {
		const reader = result.response.body?.getReader();
		if (!reader) {
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
				break;
			}
			chunks.push(value);
		}

		const decoder = new TextDecoder();
		html = chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('') +
			decoder.decode();
	} catch {
		return NextResponse.json({ error: 'Failed to read response' }, { status: 502 });
	}

	// --- Parse OGP ---
	const ogp = parseOgp(html, result.finalUrl);
	if (!ogp) {
		return NextResponse.json({ error: 'No OGP metadata found' }, { status: 404 });
	}

	return NextResponse.json(
		{ data: ogp },
		{
			headers: {
				'Cache-Control': 'public, max-age=86400, s-maxage=86400',
			},
		},
	);
}
