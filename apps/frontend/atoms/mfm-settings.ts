'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// ---------------------------------------------------------------------------
// Type definition
// ---------------------------------------------------------------------------

export interface MfmSettings {
	/** Global MFM enable/disable. When OFF, parseSimple() is used (emoji only). */
	enabled: boolean;
	mention: boolean;
	hashtag: boolean;
	url: boolean;
	link: boolean;
	/** Custom emoji (:name:) */
	emojiCode: boolean;
	bold: boolean;
	italic: boolean;
	strike: boolean;
	/** Shrink text */
	small: boolean;
	quote: boolean;
	center: boolean;
	/** Yomigana reading aid */
	ruby: boolean;
	code: {
		inline: boolean;
		block: boolean;
	};
	flip: boolean;
	font: {
		serif: boolean;
		monospace: boolean;
		cursive: boolean;
		fantasy: boolean;
	};
	blur: boolean;
	search: boolean;
	/** Background color */
	bg: boolean;
	/** Text color */
	fg: boolean;
	border: boolean;
	rotate: boolean;
	/** Shift position */
	position: boolean;
	scale: boolean;
	/** Allow x3/x4 sizes (x2 is always allowed when expand is on) */
	expand: {
		allowLargerThanX2: boolean;
	};
	animation: {
		jelly: boolean;
		tada: boolean;
		jump: boolean;
		bounce: boolean;
		spin: boolean;
		shake: boolean;
		twitch: boolean;
	};
	rainbow: boolean;
	sparkle: boolean;
}

// ---------------------------------------------------------------------------
// Default values — everything enabled
// ---------------------------------------------------------------------------

export const DEFAULT_MFM_SETTINGS: MfmSettings = {
	enabled: true,
	mention: true,
	hashtag: true,
	url: true,
	link: true,
	emojiCode: true,
	bold: true,
	italic: true,
	strike: true,
	small: true,
	quote: true,
	center: true,
	ruby: true,
	code: { inline: true, block: true },
	flip: true,
	font: { serif: true, monospace: true, cursive: true, fantasy: true },
	blur: true,
	search: true,
	bg: true,
	fg: true,
	border: true,
	rotate: true,
	position: true,
	scale: true,
	expand: { allowLargerThanX2: true },
	animation: {
		jelly: true,
		tada: true,
		jump: true,
		bounce: true,
		spin: true,
		shake: true,
		twitch: true,
	},
	rainbow: true,
	sparkle: true,
};

// ---------------------------------------------------------------------------
// SSR-safe localStorage storage adapter
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ciel-mfm-settings';

const createLocalStorageAdapter = () => {
	if (typeof window === 'undefined') {
		return {
			getItem: (_key: string, initialValue: MfmSettings) => initialValue,
			setItem: (_key: string, _value: MfmSettings) => {},
			removeItem: (_key: string) => {},
		};
	}

	return {
		getItem: (key: string, initialValue: MfmSettings): MfmSettings => {
			try {
				const raw = localStorage.getItem(key);
				if (!raw) return initialValue;
				const parsed = JSON.parse(raw);
				// Deep merge with defaults so newly added keys are populated
				return deepMerge(initialValue, parsed);
			} catch {
				return initialValue;
			}
		},
		setItem: (key: string, value: MfmSettings) => {
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
 * Deep-merge source into target.
 * Only merges keys that exist in target (the defaults) to prevent stale keys.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge<T>(target: T, source: any): T {
	if (
		target === null ||
		typeof target !== 'object' ||
		Array.isArray(target) ||
		source === null ||
		typeof source !== 'object' ||
		Array.isArray(source)
	) {
		return typeof target === typeof source ? source : target;
	}
	const result = { ...target };
	for (const key of Object.keys(target as object)) {
		if (!(key in source)) continue;
		const targetVal = (target as Record<string, unknown>)[key];
		const sourceVal = source[key];
		if (
			targetVal !== null &&
			typeof targetVal === 'object' &&
			!Array.isArray(targetVal) &&
			sourceVal !== null &&
			typeof sourceVal === 'object' &&
			!Array.isArray(sourceVal)
		) {
			(result as Record<string, unknown>)[key] = deepMerge(targetVal, sourceVal);
		} else if (typeof targetVal === typeof sourceVal) {
			(result as Record<string, unknown>)[key] = sourceVal;
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// Atom
// ---------------------------------------------------------------------------

export const mfmSettingsAtom = atomWithStorage<MfmSettings>(
	STORAGE_KEY,
	DEFAULT_MFM_SETTINGS,
	createLocalStorageAdapter(),
);

// ---------------------------------------------------------------------------
// Derived helper atom: is MFM globally enabled?
// ---------------------------------------------------------------------------

export const mfmEnabledAtom = atom((get) => get(mfmSettingsAtom).enabled);

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Read the full MFM settings object. */
export function useMfmSettings() {
	return useAtomValue(mfmSettingsAtom);
}

/** Get setter to update MFM settings. */
export function useSetMfmSettings() {
	return useSetAtom(mfmSettingsAtom);
}
