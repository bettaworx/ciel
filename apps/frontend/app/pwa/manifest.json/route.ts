import { NextResponse } from 'next/server';
import { getInternalApiBaseUrl } from '@/lib/server/api-base-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5分キャッシュ

/**
 * Dynamic Web App Manifest API
 * 
 * Generates a manifest.json file dynamically based on server configuration.
 * The manifest includes:
 * - Server name and description from /server/info API
 * - PWA icons (192x192, 512x512)
 * - Theme colors and display settings
 * 
 * @returns JSON response with Web App Manifest
 */
export async function GET() {
	try {
		// 1. Fetch server info from backend
		const baseUrl = getInternalApiBaseUrl();
		
		const serverInfoRes = await fetch(`${baseUrl}/server/info`, {
			next: { revalidate: 300 }
		});
		
		const serverInfo = serverInfoRes.ok ? await serverInfoRes.json() : null;
		
		// 2. Build manifest.json
		const serverName = serverInfo?.serverName || 'Ciel';
		const manifest = {
			name: serverName,
			short_name: serverName,
			description: serverInfo?.serverDescription || 'A minimal SNS application',
			start_url: '/',
			display: 'standalone',
			background_color: '#f7f7f7', // oklch(0.97 0 0) RGB approximation (light mode)
			theme_color: '#f7f7f7',
			orientation: 'portrait-primary',
			icons: [
				{
					src: '/pwa/icon-192',
					sizes: '192x192',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/pwa/icon-512',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'any'
				},
				{
					src: '/pwa/icon-512',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable'
				}
			],
			categories: ['social', 'lifestyle'],
			lang: 'ja'
		};
		
		return NextResponse.json(manifest, {
			headers: {
				'Content-Type': 'application/manifest+json',
				'Cache-Control': 'public, max-age=300',
			}
		});
		
	} catch (error) {
		console.error('Error generating manifest:', error);
		
		// Fallback: Return default manifest
		return NextResponse.json({
			name: 'Ciel',
			short_name: 'Ciel',
			description: 'A minimal SNS application',
			start_url: '/',
			display: 'standalone',
			background_color: '#f7f7f7',
			theme_color: '#f7f7f7',
			icons: [
				{ src: '/pwa/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
				{ src: '/pwa/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' }
			]
		}, {
			headers: {
				'Content-Type': 'application/manifest+json',
				'Cache-Control': 'public, max-age=300',
			}
		});
	}
}
