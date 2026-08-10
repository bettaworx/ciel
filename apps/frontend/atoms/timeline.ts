'use client';

import { atomWithStorage } from 'jotai/utils';

/** Which timeline the home page shows. */
export type TimelineScope = 'home' | 'global';

const isTimelineScope = (value: unknown): value is TimelineScope =>
	value === 'home' || value === 'global';

// SSR-safe localStorage storage adapter
const createTimelineScopeAdapter = () => {
	if (typeof window === 'undefined') {
		return {
			getItem: (_key: string, initialValue: TimelineScope) => initialValue,
			setItem: (_key: string, _value: TimelineScope) => {},
			removeItem: (_key: string) => {},
		};
	}

	return {
		getItem: (key: string, initialValue: TimelineScope): TimelineScope => {
			try {
				const value = localStorage.getItem(key);
				return isTimelineScope(value) ? value : initialValue;
			} catch {
				return initialValue;
			}
		},
		setItem: (key: string, value: TimelineScope) => {
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

/**
 * The last timeline the user chose, kept across reloads.
 *
 * Signed-out visitors are shown the global timeline regardless of this value,
 * and the stored choice is left alone so it comes back on the next sign-in.
 */
export const timelineScopeAtom = atomWithStorage<TimelineScope>(
	'ciel-timeline-scope',
	'home',
	createTimelineScopeAdapter(),
);
