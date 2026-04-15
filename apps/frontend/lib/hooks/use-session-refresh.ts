'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/atoms/auth';
import { createApiClient } from '@/lib/api/client';

/**
 * Refresh interval in milliseconds.
 * Set to 50 minutes to proactively refresh before the 60-minute access token expires.
 * The API client's 401-retry logic provides a fallback for cases where the token
 * expires before the scheduled refresh fires.
 *
 * Token lifetime: 60 minutes (3600 seconds)
 * Refresh frequency: 50 minutes (3000 seconds) — 10-minute buffer before expiry
 */
const REFRESH_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes

/**
 * Threshold for triggering an immediate refresh when the tab becomes visible again.
 * If the tab was hidden for this long, refresh right away rather than waiting for
 * the next scheduled interval.
 *
 * Set to 45 minutes so a refresh always fires before the 60-minute token expires,
 * even accounting for minor timer drift.
 */
const VISIBILITY_REFRESH_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes

const api = createApiClient();

/**
 * Hook to automatically refresh the access token by periodically calling /auth/refresh.
 *
 * - Only runs when user is authenticated
 * - Calls /auth/refresh every 50 minutes (access token TTL is 60 minutes)
 * - Immediately refreshes when the tab becomes visible after being hidden ≥ 45 minutes
 * - Immediately refreshes when the browser comes back online
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
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const hiddenAtRef = useRef<number | null>(null);
	const isRefreshingRef = useRef(false);

	const tryRefresh = useCallback(async () => {
		if (isRefreshingRef.current) return;
		isRefreshingRef.current = true;
		try {
			await api.refresh();
		} catch {
			// Network error or server issue — the 401 intercept handles token expiry
		} finally {
			isRefreshingRef.current = false;
		}
	}, []);

	const resetInterval = useCallback(
		(callback: () => Promise<void>) => {
			if (intervalRef.current) clearInterval(intervalRef.current);
			intervalRef.current = setInterval(callback, REFRESH_INTERVAL_MS);
		},
		[]
	);

	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (!isAuthenticated) {
			return;
		}

		// Set up periodic token refresh
		resetInterval(tryRefresh);

		// Refresh immediately when the tab becomes visible after a long absence
		const handleVisibilityChange = async () => {
			if (document.visibilityState === 'hidden') {
				hiddenAtRef.current = Date.now();
				return;
			}
			const hiddenAt = hiddenAtRef.current;
			hiddenAtRef.current = null;
			if (hiddenAt !== null && Date.now() - hiddenAt >= VISIBILITY_REFRESH_THRESHOLD_MS) {
				await tryRefresh();
				resetInterval(tryRefresh); // reset so the next tick is a full interval away
			}
		};

		// Refresh immediately when the browser comes back online
		const handleOnline = async () => {
			await tryRefresh();
			resetInterval(tryRefresh);
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('online', handleOnline);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('online', handleOnline);
		};
	}, [isAuthenticated, tryRefresh, resetInterval]);
}
