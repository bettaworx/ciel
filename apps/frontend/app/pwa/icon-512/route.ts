import { NextResponse } from 'next/server';
import { fetchServerIcon, generateDefaultIcon } from '@/lib/pwa/icon-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 30;

/**
 * PWA Icon API - 512x512
 * 
 * Generates a 512x512 icon for PWA installation and maskable icon.
 * - If server icon is configured, resizes it to 512x512
 * - Otherwise, generates a default gradient icon
 * 
 * @returns Image response (PNG)
 */
export async function GET() {
	try {
		// Try to fetch and resize server icon
		const serverIconBuffer = await fetchServerIcon(512);
		
		if (serverIconBuffer) {
			return new NextResponse(new Uint8Array(serverIconBuffer), {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=30',
				}
			});
		}
		
		// Fallback: Generate default icon
		return await generateDefaultIcon(512);
		
	} catch (error) {
		console.error('Error generating 512x512 icon:', error);
		return await generateDefaultIcon(512);
	}
}
