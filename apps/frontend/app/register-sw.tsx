'use client';

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 * 
 * Registers the service worker for PWA functionality.
 * - Only runs in production environment
 * - Automatically checks for updates every hour
 * - Handles updates silently without user notification
 */
export function RegisterServiceWorker() {
	useEffect(() => {
		// Only register SW in production
		if (process.env.NODE_ENV !== 'production') {
			console.log('[SW] Disabled in development mode');
			return;
		}
		
		// Check if service worker is supported
		if (!('serviceWorker' in navigator)) {
			console.log('[SW] Not supported in this browser');
			return;
		}

		// Register service worker on window load
		window.addEventListener('load', () => {
			navigator.serviceWorker
				.register('/sw.js')
				.then((registration) => {
					console.log('[SW] Registered successfully:', registration.scope);
					
					// Check for updates every hour
					setInterval(() => {
						registration.update();
					}, 60 * 60 * 1000);
					
					// Handle updates silently (no user notification)
					registration.addEventListener('updatefound', () => {
						const newWorker = registration.installing;
						if (newWorker) {
							newWorker.addEventListener('statechange', () => {
								if (newWorker.state === 'activated') {
									console.log('[SW] Updated successfully');
									// Silent update - no user notification
								}
							});
						}
					});
				})
				.catch((error) => {
					console.error('[SW] Registration failed:', error);
				});
		});
	}, []);

	return null; // This component doesn't render anything
}
