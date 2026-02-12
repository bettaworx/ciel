import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const revalidate = 30; // 30秒キャッシュ（設定変更を早期反映）

const size = { width: 48, height: 48 };
export { size };

function resolveApiBaseUrl(): string {
	const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined;
	const DEFAULT_BASE_URL = '/api/v1';
	const raw = (fromEnv ?? DEFAULT_BASE_URL).trim();
	if (!raw) return DEFAULT_BASE_URL;
	const noTrailingSlash = raw.replace(/\/+$/, '');

	// If the user provides just an origin like http://localhost:6137, assume the API lives under /api/v1.
	if (/^https?:\/\//.test(noTrailingSlash) && !/\/api\/v1$/.test(noTrailingSlash)) {
		return `${noTrailingSlash}/api/v1`;
	}

	return noTrailingSlash;
}

async function fetchServerIcon(): Promise<ArrayBuffer | null> {
	try {
		const baseUrl = resolveApiBaseUrl();
		
		// Build absolute URL for server-side fetch
		let apiUrl = baseUrl;
		if (apiUrl.startsWith('/')) {
			// Relative URL - need to make it absolute for server-side fetch
			const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
			const host = process.env.VERCEL_URL || 'localhost:3000';
			apiUrl = `${protocol}://${host}${baseUrl}`;
		}

		const serverInfoResponse = await fetch(`${apiUrl}/server/info`, {
			next: { revalidate: 30 },
		});

		if (!serverInfoResponse.ok) {
			console.error('Failed to fetch server info:', serverInfoResponse.status);
			return null;
		}

		const serverInfo = await serverInfoResponse.json();
		const iconUrl = serverInfo?.serverIconUrl;

		if (!iconUrl || typeof iconUrl !== 'string') {
			return null;
		}

		// For animated server icons (GIFs converted to WebP), try to fetch the static version first
		// The static version (first frame only) is better for favicons
		const staticIconUrl = iconUrl.replace('/image.webp', '/image_static.webp').replace('/image.png', '/image_static.png');
		
		// Try static version first
		if (staticIconUrl !== iconUrl) {
			const staticIconResponse = await fetch(staticIconUrl, {
				next: { revalidate: 30 },
			});

			if (staticIconResponse.ok) {
				return await staticIconResponse.arrayBuffer();
			}
		}

		// Fetch the actual icon image (fallback to animated version if static doesn't exist)
		const iconResponse = await fetch(iconUrl, {
			next: { revalidate: 30 },
		});

		if (!iconResponse.ok) {
			console.error('Failed to fetch icon from URL:', iconUrl, iconResponse.status);
			return null;
		}

		return await iconResponse.arrayBuffer();
	} catch (error) {
		console.error('Error fetching server icon:', error);
		return null;
	}
}

async function getFallbackIcon(): Promise<ArrayBuffer> {
	const faviconPath = join(process.cwd(), 'app', 'favicon.ico');
	const buffer = await readFile(faviconPath);
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export default async function Icon() {
	try {
		// Try to fetch server icon
		const serverIconBuffer = await fetchServerIcon();

		if (serverIconBuffer) {
			// Determine content type from buffer
			const uint8Array = new Uint8Array(serverIconBuffer);
			let contentType = 'image/x-icon';

			// Simple magic number detection
			if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4e && uint8Array[3] === 0x47) {
				contentType = 'image/png';
			} else if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8 && uint8Array[2] === 0xff) {
				contentType = 'image/jpeg';
			} else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
				         uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
				contentType = 'image/webp';
			}

			return new Response(serverIconBuffer, {
				headers: {
					'Content-Type': contentType,
					'Cache-Control': 'public, max-age=30, immutable',
				},
			});
		}

		// Fallback to default favicon.ico
		const fallbackBuffer = await getFallbackIcon();
		return new Response(fallbackBuffer, {
			headers: {
				'Content-Type': 'image/x-icon',
				'Cache-Control': 'public, max-age=30, immutable',
			},
		});
	} catch (error) {
		console.error('Error generating icon:', error);
		
		// Ultimate fallback - try to return default favicon
		try {
			const fallbackBuffer = await getFallbackIcon();
			return new Response(fallbackBuffer, {
				headers: {
					'Content-Type': 'image/x-icon',
					'Cache-Control': 'public, max-age=30, immutable',
				},
			});
		} catch {
			// If even fallback fails, return empty response
			return new Response(null, { status: 404 });
		}
	}
}
