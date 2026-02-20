import { ImageResponse } from 'next/og';
import sharp from 'sharp';

/**
 * Fetch and resize server icon from backend API
 * 
 * This function retrieves the server icon URL from the /server/info endpoint,
 * fetches the actual icon image, and resizes it to the specified size.
 * It prioritizes static versions (first frame) for animated images like GIFs.
 * 
 * @param size - Target size for the icon (width and height)
 * @returns Buffer of the resized icon image, or null if not available
 */
export async function fetchServerIcon(size: number): Promise<Buffer | null> {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:6137';
		const baseUrl = apiUrl.startsWith('/') ? `http://localhost:6137${apiUrl}` : apiUrl;
		
		const serverInfoRes = await fetch(`${baseUrl}/api/v1/server/info`, {
			cache: 'no-store'
		});
		
		if (!serverInfoRes.ok) {
			console.error('Failed to fetch server info:', serverInfoRes.status);
			return null;
		}
		
		const serverInfo = await serverInfoRes.json();
		const iconUrl = serverInfo?.serverIconUrl;
		
		if (!iconUrl || typeof iconUrl !== 'string') {
			return null;
		}
		
		// For animated server icons (GIFs converted to WebP), try to fetch the static version first
		// The static version (first frame only) is better for favicons and PWA icons
		const staticIconUrl = iconUrl
			.replace('/image.webp', '/image_static.webp')
			.replace('/image.png', '/image_static.png');
		
		let imageBuffer: ArrayBuffer | null = null;
		
		// Try static version first
		if (staticIconUrl !== iconUrl) {
			const staticIconRes = await fetch(staticIconUrl, {
				cache: 'no-store',
			});

			if (staticIconRes.ok) {
				imageBuffer = await staticIconRes.arrayBuffer();
			}
		}

		// Fetch the actual icon image (fallback to animated version if static doesn't exist)
		if (!imageBuffer) {
			const iconRes = await fetch(iconUrl, {
				cache: 'no-store',
			});

			if (!iconRes.ok) {
				console.error('Failed to fetch icon from URL:', iconUrl, iconRes.status);
				return null;
			}

			imageBuffer = await iconRes.arrayBuffer();
		}

		// Resize the image using sharp
		const resizedBuffer = await sharp(Buffer.from(imageBuffer))
			.resize(size, size, {
				fit: 'cover',
				position: 'center',
			})
			.png()
			.toBuffer();

		return resizedBuffer;
	} catch (error) {
		console.error('Error fetching server icon:', error);
		return null;
	}
}

/**
 * Generate a default icon with gradient background
 * 
 * Creates a simple icon with a top-to-bottom gray gradient.
 * Used as a fallback when no server icon is configured.
 * 
 * @param size - The size of the icon (width and height)
 * @returns ImageResponse with the generated icon
 */
export async function generateDefaultIcon(size: number) {
	return new ImageResponse(
		(
			<div
				style={{
					width: size,
					height: size,
					display: 'flex',
					background: 'linear-gradient(180deg, #888888 0%, #444444 100%)',
				}}
			/>
		),
		{ width: size, height: size }
	);
}
