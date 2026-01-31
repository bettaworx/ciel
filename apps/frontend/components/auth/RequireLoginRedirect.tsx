'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { authStatusAtom, isAuthenticatedAtom } from '@/atoms/auth';

interface RequireLoginRedirectProps {
	children: React.ReactNode;
	redirectTo?: string;
	fallback?: React.ReactNode;
}

export function RequireLoginRedirect({
	children,
	redirectTo = '/login',
	fallback = null,
}: RequireLoginRedirectProps) {
	const isAuthenticated = useAtomValue(isAuthenticatedAtom);
	const authStatus = useAtomValue(authStatusAtom);
	const router = useRouter();

	useEffect(() => {
		if (authStatus === 'loading') {
			return;
		}
		if (!isAuthenticated) {
			router.replace(redirectTo);
		}
	}, [authStatus, isAuthenticated, redirectTo, router]);

	if (isAuthenticated) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}
