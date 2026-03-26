'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// SSR-safe localStorage adapter for boolean
const createBooleanStorageAdapter = () => {
	if (typeof window === 'undefined') {
		return {
			getItem: (_key: string, initialValue: boolean) => initialValue,
			setItem: (_key: string, _value: boolean) => {},
			removeItem: (_key: string) => {},
		};
	}

	return {
		getItem: (key: string, initialValue: boolean): boolean => {
			try {
				const value = localStorage.getItem(key);
				if (value === 'true') return true;
				if (value === 'false') return false;
				return initialValue;
			} catch {
				return initialValue;
			}
		},
		setItem: (key: string, value: boolean) => {
			try {
				localStorage.setItem(key, String(value));
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

/** サイドバーのピン止め状態 (localStorageに永続化) */
export const sidebarPinnedAtom = atomWithStorage<boolean>(
	'ciel-sidebar-pinned',
	false,
	createBooleanStorageAdapter()
);

/** サイドバーの展開状態 (一時的 — ホバーまたはピン時にtrue、MainContent用) */
export const sidebarExpandedAtom = atom<boolean>(false);
