'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/atoms/auth';
import { createApiClient } from '@/lib/api/client';

/**
 * Refresh interval in milliseconds.
 * Set to 5 minutes (300,000ms) to refresh the session before token expiration.
 * 
 * Token lifetime: 1 hour (3600 seconds)
 * Refresh frequency: 5 minutes (300 seconds)
 * Number of refresh opportunities: 12 per hour
 */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const api = createApiClient();

/**
 * Hook to automatically refresh user session by periodically calling /me endpoint.
 * 
 * - Only runs when user is authenticated
 * - Calls /me endpoint every 5 minutes
 * - Backend middleware automatically refreshes the cookie on each request
 * - This ensures active users maintain their session indefinitely
 * 
 * @example
 * function App() {
 *   useSessionRefresh();
 *   return <YourApp />;
 * }
 */
export function useSessionRefresh() {
	const isAuthenticated = useAtomValue(isAuthenticatedAtom);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		// Clear any existing interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		// Only start refresh interval if user is authenticated
		if (!isAuthenticated) {
			return;
		}

		// Set up periodic session refresh
		intervalRef.current = setInterval(async () => {
			try {
				await api.me();
			} catch (error) {
				// Network error or other issue - continue trying
			}
		}, REFRESH_INTERVAL_MS);

		// Cleanup interval on unmount or when auth state changes
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isAuthenticated]);
}
