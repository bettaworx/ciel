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

		// List of events to monitor for user activity
		const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

		// Register event listeners
		events.forEach((event) => {
			window.addEventListener(event, handleActivity, { passive: true });
		});

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
		};
	}, [onInactive, timeoutMs]);
}
