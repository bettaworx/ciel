'use client';

import { atomWithStorage } from 'jotai/utils';
import { isSearchHistory } from '@/lib/search-history';

const STORAGE_KEY = 'ciel-search-history';

// SSR-safe localStorage storage adapter
const createSearchHistoryAdapter = () => {
	if (typeof window === 'undefined') {
		return {
			getItem: (_key: string, initialValue: string[]) => initialValue,
			setItem: (_key: string, _value: string[]) => {},
			removeItem: (_key: string) => {},
		};
	}

	return {
		getItem: (key: string, initialValue: string[]): string[] => {
			try {
				const raw = localStorage.getItem(key);
				if (raw === null) return initialValue;
				const parsed: unknown = JSON.parse(raw);
				// Anything else in this key is someone else's data or a corrupted
				// write; start over rather than hand the UI a bad shape.
				return isSearchHistory(parsed) ? parsed : initialValue;
			} catch {
				return initialValue;
			}
		},
		setItem: (key: string, value: string[]) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
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

/**
 * Past searches, newest first, kept on this device only.
 *
 * Never sent anywhere: the dropdown is local recall, not a server suggestion.
 */
export const searchHistoryAtom = atomWithStorage<string[]>(
	STORAGE_KEY,
	[],
	createSearchHistoryAdapter(),
);
