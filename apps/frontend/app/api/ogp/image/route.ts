import { NextResponse } from 'next/server';
import { safeFetch } from '@/lib/ogp/ssrf';
import { imageProxyRateLimiter, getClientIdentifier } from '@/lib/ogp/rate-limit';

export const runtime = 'nodejs';

/** Maximum image size: 5 MiB */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME type prefixes. */
const ALLOWED_IMAGE_TYPES = ['image/'];

export async function GET(request: Request): Promise<NextResponse> {
	// --- Rate limit ---
	const clientId = getClientIdentifier(request);
	if (!imageProxyRateLimiter.check(clientId)) {
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
			return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
		}
	} catch {
		return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
	}

	// --- Fetch the image ---
	const result = await safeFetch(url, {
		allowedContentTypes: ALLOWED_IMAGE_TYPES,
		maxBodySize: MAX_IMAGE_SIZE,
		headers: {
			Accept: 'image/webp, image/avif, image/*, */*;q=0.1',
		},
	});

	if (!result.ok) {
		const status = result.status ?? 502;
		return NextResponse.json({ error: result.reason }, { status });
	}

	// --- Stream the image body with size limit ---
	const reader = result.response.body?.getReader();
	if (!reader) {
		return NextResponse.json({ error: 'Empty response body' }, { status: 502 });
	}

	const chunks: Uint8Array[] = [];
	let totalSize = 0;

	try {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			totalSize += value.byteLength;
			if (totalSize > MAX_IMAGE_SIZE) {
				reader.cancel();
				return NextResponse.json({ error: 'Image too large' }, { status: 413 });
			}
			chunks.push(value);
		}
	} catch {
		return NextResponse.json({ error: 'Failed to read image' }, { status: 502 });
	}

	// Combine chunks into a single buffer.
	const buffer = new Uint8Array(totalSize);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.byteLength;
	}

	// Determine Content-Type from the upstream response.
	const contentType = result.response.headers.get('content-type') ?? 'image/png';

	return new NextResponse(buffer, {
		status: 200,
		headers: {
			'Content-Type': contentType,
			'Content-Length': String(totalSize),
			'Cache-Control': 'public, max-age=86400, immutable',
			// Prevent the browser from interpreting the image as something else.
			'X-Content-Type-Options': 'nosniff',
		},
	});
}
