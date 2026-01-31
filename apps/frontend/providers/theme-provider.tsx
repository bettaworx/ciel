'use client';

import { useAtom } from 'jotai';
import { useEffect, type ReactNode } from 'react';
import { themeAtom } from '@/atoms/theme';

// Get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
	if (typeof window === 'undefined') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme] = useAtom(themeAtom);

	// Apply theme to document
	useEffect(() => {
		const root = document.documentElement;
		const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

		if (effectiveTheme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}

		// Listen for system theme changes when theme is 'system'
		if (theme === 'system') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handler = () => {
				const newSystemTheme = getSystemTheme();
				if (newSystemTheme === 'dark') {
					root.classList.add('dark');
				} else {
					root.classList.remove('dark');
				}
			};

			mediaQuery.addEventListener('change', handler);
			return () => mediaQuery.removeEventListener('change', handler);
		}
	}, [theme]);

	return <>{children}</>;
}
