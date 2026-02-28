'use client';

import { atomWithStorage } from 'jotai/utils';

export type Theme = 'light' | 'dark' | 'system';

// Get initial theme from system preference
export const getSystemTheme = (): 'light' | 'dark' => {
	if (typeof window === 'undefined') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// SSR-safe localStorage storage adapter
const createLocalStorageAdapter = () => {
	if (typeof window === 'undefined') {
		return {
			getItem: (_key: string, initialValue: Theme) => initialValue,
			setItem: (_key: string, _value: Theme) => {},
			removeItem: (_key: string) => {},
		};
	}

	return {
		getItem: (key: string, initialValue: Theme): Theme => {
			try {
				const value = localStorage.getItem(key);
				if (value === 'light' || value === 'dark' || value === 'system') {
					return value;
				}
				return initialValue;
			} catch {
				return initialValue;
			}
		},
		setItem: (key: string, value: Theme) => {
			try {
				localStorage.setItem(key, value);
			} catch {
				// Storage full or unavailable — silently ignore
			}
		},
		removeItem: (key: string) => {
			try {
				localStorage.removeItem(key);
			} catch {
				// Silently ignore
			}
		},
	};
};

// Default to system
const defaultTheme: Theme = 'system';

export const themeAtom = atomWithStorage<Theme>('ciel-theme', defaultTheme, createLocalStorageAdapter());
