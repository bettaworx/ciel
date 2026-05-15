import { ImageResponse } from 'next/og';
import {
	getInternalApiBaseUrl,
	rewriteBackendUrlForServerFetch,
} from '@/lib/server/api-base-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 30; // 30秒キャッシュ（設定変更を早期反映）

const size = { width: 48, height: 48 };
export { size };

async function fetchServerIcon(): Promise<ArrayBuffer | null> {
	try {
		const apiUrl = getInternalApiBaseUrl();

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
		const serverFetchIconUrl = rewriteBackendUrlForServerFetch(iconUrl);
		const staticIconUrl = serverFetchIconUrl.replace('/image.webp', '/image_static.webp').replace('/image.png', '/image_static.png');
		
		// Try static version first
		if (staticIconUrl !== serverFetchIconUrl) {
			const staticIconResponse = await fetch(staticIconUrl, {
				next: { revalidate: 30 },
			});

			if (staticIconResponse.ok) {
				return await staticIconResponse.arrayBuffer();
			}
		}

		// Fetch the actual icon image (fallback to animated version if static doesn't exist)
		const iconResponse = await fetch(serverFetchIconUrl, {
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

function getFallbackIcon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: size.width,
					height: size.height,
					background: '#444444',
				}}
			/>
		),
		size,
	);
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
		return getFallbackIcon();
	} catch (error) {
		console.error('Error generating icon:', error);
		return getFallbackIcon();
	}
}
