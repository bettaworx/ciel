'use client';

import { useEffect, useState } from 'react';

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
	const [isSidebarVisible, setIsSidebarVisible] = useState(false);

	useEffect(() => {
		// サイドバーの表示状態を監視
		const checkSidebarVisibility = () => {
			setIsSidebarVisible(document.body.hasAttribute('data-sidebar-visible'));
		};

		// 初回チェック
		checkSidebarVisibility();

		// MutationObserverでbody属性の変更を監視
		const observer = new MutationObserver(checkSidebarVisibility);
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['data-sidebar-visible'],
		});

		return () => observer.disconnect();
	}, []);

	return (
		<div
			className={
				isSidebarVisible
					? 'sm:ml-20 pb-20 sm:pb-0'
					: ''
			}
		>
			{children}
		</div>
	);
}
