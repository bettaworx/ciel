import { NextResponse } from 'next/server';
import { safeFetch } from '@/lib/ogp/ssrf';
import { imageProxyRateLimiter, getClientIdentifier } from '@/lib/ogp/rate-limit';
import { logDebug, logWarn, logError, getDomain } from '@/lib/ogp/logger';

export const runtime = 'nodejs';

/** Maximum image size: 5 MiB */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME type prefixes. */
const ALLOWED_IMAGE_TYPES = ['image/'];

/** Maximum retry attempts for rate-limited requests (429 errors). */
const MAX_RETRY_ATTEMPTS = 3;

/** Initial backoff delay in milliseconds. */
const INITIAL_BACKOFF_MS = 1000;

export async function GET(request: Request): Promise<NextResponse> {
	try {
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
			return NextResponse.json(
				{ error: 'Missing "url" query parameter' },
				{ status: 400 },
			);
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

		// --- Fetch the image with retry logic for 429 errors ---
		let result = await safeFetch(url, {
			allowedContentTypes: ALLOWED_IMAGE_TYPES,
			maxBodySize: MAX_IMAGE_SIZE,
			headers: {
				Accept: 'image/webp, image/avif, image/*, */*;q=0.1',
			},
		});

		// Retry on 429 (rate limit) with exponential backoff
		let retryCount = 0;
		while (!result.ok && result.status === 429 && retryCount < MAX_RETRY_ATTEMPTS) {
			const backoffMs = INITIAL_BACKOFF_MS * 2 ** retryCount;
			logDebug('Retrying after 429', {
				attempt: retryCount + 1,
				maxAttempts: MAX_RETRY_ATTEMPTS,
				backoffMs,
				urlDomain: getDomain(url),
			});
			await new Promise((resolve) => setTimeout(resolve, backoffMs));

			result = await safeFetch(url, {
				allowedContentTypes: ALLOWED_IMAGE_TYPES,
				maxBodySize: MAX_IMAGE_SIZE,
				headers: {
					Accept: 'image/webp, image/avif, image/*, */*;q=0.1',
				},
			});
			retryCount++;
		}

		if (!result.ok) {
			logError('Image safeFetch failed', {
				reason: result.reason,
				status: result.status,
				urlDomain: getDomain(url),
			});
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
		} catch (err) {
			logError('Failed to read image body', {
				error: err instanceof Error ? err.message : String(err),
				errorType: err?.constructor?.name,
				urlDomain: getDomain(url),
			});
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
				// Cache for 7 days (604800 seconds) to reduce upstream requests
				'Cache-Control': 'public, max-age=604800, immutable',
				// Prevent the browser from interpreting the image as something else.
				'X-Content-Type-Options': 'nosniff',
			},
		});
	} catch (err) {
		logError('Unhandled error in image proxy route', {
			error: err instanceof Error ? err.message : String(err),
			errorType: err?.constructor?.name,
			stack: err instanceof Error ? err.stack : undefined,
		});
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
