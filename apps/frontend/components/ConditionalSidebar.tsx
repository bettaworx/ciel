'use client';

import { usePathname } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/atoms/auth';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { isConcentratedMode } from '@/lib/utils/concentrated-mode';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { useEffect } from 'react';

/**
 * 認証状態と集中モード判定に基づいてサイドバーを条件付きでレンダリング
 * Conditionally renders the sidebar based on authentication and concentrated mode
 */
export function ConditionalSidebar() {
	const pathname = usePathname();
	const isAuthenticated = useAtomValue(isAuthenticatedAtom);
	const isDesktop = useMediaQuery("(min-width: 640px)");

	// 集中モードの場合はサイドバーを非表示
	// Hide sidebar in concentrated mode
	const isConcentrated = isConcentratedMode(pathname);
	
	// サイドバーが表示されるかどうかを判定
	const shouldShowSidebar = !isConcentrated && isAuthenticated;

	// サイドバー表示状態をbodyに反映（CSSでレイアウト調整用）
	useEffect(() => {
		if (shouldShowSidebar) {
			document.body.setAttribute('data-sidebar-visible', 'true');
		} else {
			document.body.removeAttribute('data-sidebar-visible');
		}
	}, [shouldShowSidebar]);

	if (!shouldShowSidebar) {
		return null;
	}

	// デスクトップ: 左側サイドバー
	// Desktop: left sidebar
	if (isDesktop) {
		return <Sidebar />;
	}

	// モバイル: 下部ナビゲーション
	// Mobile: bottom navigation
	return <BottomNav />;
}
