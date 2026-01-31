'use client';

import { useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { authAtom } from '@/atoms/auth';
import { isServerOfflineAtom } from '@/atoms/offline';
import { createApiClient } from '@/lib/api/client';

export function useApi() {
	const setAuth = useSetAtom(authAtom);
	const setIsOffline = useSetAtom(isServerOfflineAtom);

	return useMemo(
		() =>
			createApiClient({
				onSessionExpired: () => {
					console.log('[useApi] Session expired, clearing auth state');
					setAuth({
						status: 'ready',
						user: null,
						error: null,
					});
				},
				onServerOffline: () => {
					console.log('[useApi] Server offline detected');
					setIsOffline(true);
					// Only redirect if not already on /offline page
					if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/offline')) {
						console.log('[useApi] Redirecting to /offline');
						window.location.href = '/offline';
					}
				},
			}),
		[setAuth, setIsOffline]
	);
}


