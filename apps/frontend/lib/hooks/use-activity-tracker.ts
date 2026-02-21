'use client';

import { useEffect, useRef } from 'react';

// Configurable inactivity timeout (default: 5 minutes)
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

// Throttle interval for activity events (avoid excessive processing)
const THROTTLE_INTERVAL_MS = 2000;

/**
 * Hook to track user activity and detect inactivity timeout.
 * 
 * Monitors user interactions (mouse, keyboard, scroll, touch) and triggers
 * a callback after a specified period of inactivity.
 * 
 * MOBILE-FRIENDLY: Automatically resets timer when page becomes visible again
 * (e.g., returning from sleep mode or switching back from another app).
 * This prevents false inactivity detection after device sleep/wake cycles.
 * 
 * @param onInactive - Callback function to invoke when user becomes inactive
 * @param timeoutMs - Inactivity timeout in milliseconds (default: 5 minutes)
 */
export function useActivityTracker(
	onInactive: () => void,
	timeoutMs: number = INACTIVITY_TIMEOUT_MS
) {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastActivityRef = useRef<number>(Date.now());
	const hasTriggeredRef = useRef<boolean>(false);

	useEffect(() => {
		// Reset triggered flag when hook is mounted/re-enabled
		hasTriggeredRef.current = false;

		const resetTimer = () => {
			// Clear existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Update last activity timestamp
			lastActivityRef.current = Date.now();

			// Reset triggered flag when user becomes active again
			hasTriggeredRef.current = false;

			// Set new timeout
			timeoutRef.current = setTimeout(() => {
				// Only trigger once
				if (!hasTriggeredRef.current) {
					hasTriggeredRef.current = true;
					onInactive();
				}
			}, timeoutMs);
		};

		// Throttled activity handler to avoid excessive event processing
		let isThrottled = false;
		const handleActivity = () => {
			if (isThrottled) return;

			isThrottled = true;
			resetTimer();

			setTimeout(() => {
				isThrottled = false;
			}, THROTTLE_INTERVAL_MS);
		};

		// Handle page visibility change (e.g., returning from sleep/background)
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				// Page became visible again - reset timer to avoid false inactivity detection
				console.log('📱 Page visible again, resetting inactivity timer');
				resetTimer();
			}
		};

		// Handle page show event (e.g., returning from back-forward cache)
		const handlePageShow = (event: PageTransitionEvent) => {
			// If page is restored from cache (bfcache), reset timer
			if (event.persisted) {
				console.log('📱 Page restored from cache, resetting inactivity timer');
				resetTimer();
			}
		};

		// List of events to monitor for user activity
		const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

		// Register event listeners
		events.forEach((event) => {
			window.addEventListener(event, handleActivity, { passive: true });
		});

		// Register visibility change listener (for sleep/wake detection)
		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		// Register pageshow listener (for back-forward cache)
		window.addEventListener('pageshow', handlePageShow);

		// Initialize timer
		resetTimer();

		// Cleanup function
		return () => {
			// Clear timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Remove event listeners
			events.forEach((event) => {
				window.removeEventListener(event, handleActivity);
			});
			
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('pageshow', handlePageShow);
		};
	}, [onInactive, timeoutMs]);
}
