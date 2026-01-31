'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { authStatusAtom, userAtom } from '@/atoms/auth';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSessionRefresh } from '@/lib/hooks/use-session-refresh';
import { useQueryClient } from '@tanstack/react-query';

/**
 * AuthInitProvider initializes authentication state on app startup.
 * It calls initAuth() to validate stored session and check expiration.
 * Also clears reaction cache when user authentication state changes.
 * Automatically refreshes the session for authenticated users.
 */
export function AuthInitProvider({ children }: { children: React.ReactNode }) {
	const { initAuth } = useAuth();
	const authStatus = useAtomValue(authStatusAtom);
	const user = useAtomValue(userAtom);
	const queryClient = useQueryClient();
	const prevUserIdRef = useRef<string | null>(null);

	// Automatically refresh session for authenticated users
	useSessionRefresh();

	useEffect(() => {
		// Only initialize if status is idle (not already initialized)
		if (authStatus === 'idle') {
			initAuth();
		}
	}, [authStatus, initAuth]);

	// Clear reaction cache when user ID changes (login/logout/session expired)
	useEffect(() => {
		const currentUserId = user?.id || null;
		
		// Only invalidate if userId actually changed
		if (prevUserIdRef.current !== currentUserId) {
			// Invalidate all reaction queries
			queryClient.invalidateQueries({
				predicate: (query) =>
					Array.isArray(query.queryKey) &&
					query.queryKey.length >= 3 &&
					query.queryKey[0] === 'posts' &&
					query.queryKey[2] === 'reactions',
			});
			
			prevUserIdRef.current = currentUserId;
		}
	}, [user?.id, queryClient]);

	return <>{children}</>;
}
