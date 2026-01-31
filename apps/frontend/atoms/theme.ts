'use client';

import { atomWithStorage } from 'jotai/utils';
import { getCookie, setSecureCookie, deleteSecureCookie } from '@/lib/utils/cookie';

export type Theme = 'light' | 'dark' | 'system';

// Get initial theme from system preference
const getSystemTheme = (): Theme => {
	if (typeof window === 'undefined') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// SSR-safe Cookie storage adapter
const createCookieStorage = (): {
	getItem: (key: string, initialValue: Theme) => Theme;
	setItem: (key: string, value: Theme) => void;
	removeItem: (key: string) => void;
} => {
	if (typeof window === 'undefined') {
		return {
			getItem: (key: string, initialValue: Theme) => initialValue,
			setItem: (key: string, value: Theme) => {},
			removeItem: (key: string) => {},
		};
	}

	return {
		getItem: (key: string, initialValue: Theme): Theme => {
			const cookieValue = getCookie(key);
			if (cookieValue === 'light' || cookieValue === 'dark' || cookieValue === 'system') {
				return cookieValue as Theme;
			}
			// If no cookie exists, default to system
			setSecureCookie(key, 'system');
			return 'system';
		},
		setItem: (key: string, value: Theme) => {
			setSecureCookie(key, value);
		},
		removeItem: (key: string) => {
			deleteSecureCookie(key);
		},
	};
};

// Default to system
const defaultTheme: Theme = 'system';

export const themeAtom = atomWithStorage<Theme>('ciel-theme', defaultTheme, createCookieStorage());
