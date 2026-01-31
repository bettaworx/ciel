'use client';

import { useAtomValue } from 'jotai';
import { authStatusAtom, isAuthenticatedAtom } from '@/atoms/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface RequireAuthProps {
	children: React.ReactNode;
	redirectOnClose?: string; // デフォルト: '/'
	fallback?: React.ReactNode; // ローディング中の表示
}

export function RequireAuth({
	children,
	redirectOnClose = '/',
	fallback = null,
}: RequireAuthProps) {
	const isAuthenticated = useAtomValue(isAuthenticatedAtom);
	const authStatus = useAtomValue(authStatusAtom);
	const router = useRouter();
	const pathname = usePathname();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted || authStatus !== 'ready' || isAuthenticated) return;
		const redirectUrl = new URL('/login', window.location.origin);
		redirectUrl.searchParams.set('redirect', pathname || redirectOnClose);
		router.replace(redirectUrl.pathname + redirectUrl.search);
	}, [authStatus, isAuthenticated, isMounted, pathname, redirectOnClose, router]);

	// SSR対応: マウント前 or 認証状態判定中はfallbackを表示
	if (!isMounted || authStatus !== 'ready') {
		return <>{fallback}</>;
	}

	// 認証済み: 子コンポーネントを表示
	if (isAuthenticated) {
		return <>{children}</>;
	}

	return <>{fallback}</>;
}
