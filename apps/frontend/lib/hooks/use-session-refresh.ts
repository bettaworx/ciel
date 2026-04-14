'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/atoms/auth';
import { createApiClient } from '@/lib/api/client';

/**
 * Refresh interval in milliseconds.
 * Set to 13 minutes to proactively refresh before the 15-minute access token expires.
 * The API client's 401-retry logic provides a fallback for cases where the token
 * expires before the scheduled refresh fires.
 *
 * Token lifetime: 15 minutes (900 seconds)
 * Refresh frequency: 13 minutes (780 seconds) — 2-minute buffer before expiry
 */
const REFRESH_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes

const api = createApiClient();

/**
 * Hook to automatically refresh the access token by periodically calling /auth/refresh.
 *
 * - Only runs when user is authenticated
 * - Calls /auth/refresh every 13 minutes (access token TTL is 15 minutes)
 * - The refresh endpoint rotates the refresh token and issues a new access token cookie
 * - The API client's 401 intercept acts as a second-layer fallback
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

		// Set up periodic token refresh
		intervalRef.current = setInterval(async () => {
			try {
				await api.refresh();
			} catch {
				// Network error or other issue - the 401 intercept will handle expiry
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
