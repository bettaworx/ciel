'use client';

import { cn } from '@/lib/utils';

interface MainContentProps {
	children: React.ReactNode;
}

/**
 * メインコンテンツエリアのラッパーコンポーネント
 * サイドバー表示時に適切なマージンを適用する
 *
 * Main content area wrapper component
 * Applies appropriate margins when sidebar is visible
 */
export function MainContent({ children }: MainContentProps) {
	return (
		<div
			className={cn(
				'pb-20 sm:pb-0'
			)}
		>
			{children}
		</div>
	);
}
