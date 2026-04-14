'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

/**
 * Dynamic Theme Color Meta Tag Component
 * 
 * Updates the theme-color meta tag dynamically based on user's theme preference.
 * This affects the browser UI color (address bar, status bar, etc.) on mobile devices.
 * 
 * Colors are based on the --background CSS variable in globals.css:
 * - Light mode: oklch(0.97 0 0) → #f7f7f7
 * - Dark mode: oklch(0.145 0 0) → #252525
 */
export function ThemeColorMeta() {
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		// Theme colors matching globals.css
		const themeColor = resolvedTheme === 'dark'
			? '#252525'  // oklch(0.145 0 0) RGB approximation (dark mode background)
			: '#f7f7f7'; // oklch(0.97 0 0) RGB approximation (light mode background)
		
		// Update or create theme-color meta tag
		let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
		if (!meta) {
			meta = document.createElement('meta');
			meta.setAttribute('name', 'theme-color');
			document.head.appendChild(meta);
		}
		meta.setAttribute('content', themeColor);
	}, [resolvedTheme]);

	return null; // This component doesn't render anything
}
