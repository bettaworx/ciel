'use client';

import { atomWithStorage } from 'jotai/utils';

// ---------------------------------------------------------------------------
// SSR-safe localStorage storage adapter
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'ciel-video-volume';
const DEFAULT_VOLUME = 1;

const createLocalStorageAdapter = () => {
	if (typeof window === 'undefined') {
		return {
			getItem: (_key: string, initialValue: number) => initialValue,
			setItem: (_key: string, _value: number) => {},
			removeItem: (_key: string) => {},
		};
	}

	return {
		getItem: (key: string, initialValue: number): number => {
			try {
				const raw = localStorage.getItem(key);
				if (raw === null) return initialValue;
				const parsed = Number(raw);
				if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
					return parsed;
				}
				return initialValue;
			} catch {
				return initialValue;
			}
		},
		setItem: (key: string, value: number) => {
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

// ---------------------------------------------------------------------------
// Atom
// ---------------------------------------------------------------------------

/**
 * Persisted volume level (0–1) shared across all VideoPlayer instances.
 * Only the volume level is persisted; mute state is NOT stored
 * (every new video starts muted with autoplay).
 */
export const videoVolumeAtom = atomWithStorage<number>(
	STORAGE_KEY,
	DEFAULT_VOLUME,
	createLocalStorageAdapter(),
);

// ---------------------------------------------------------------------------
// Single-video playback manager
// ---------------------------------------------------------------------------
// Ensures only one video plays at a time. Each VideoPlayer registers a pause
// callback; when a new video claims "active" status the previous one is paused.

type PauseCallback = () => void;

let activeVideo: { id: string; pause: PauseCallback } | null = null;

/**
 * Claim playback for a video. If another video is currently active it will
 * be paused first. Call with `null` to release without activating another.
 */
export function claimPlayback(id: string, pause: PauseCallback): void {
	if (activeVideo && activeVideo.id !== id) {
		activeVideo.pause();
	}
	activeVideo = { id, pause };
}

/**
 * Release playback for a specific video (e.g. when it scrolls out of view).
 * Only releases if the given id is currently the active video.
 */
export function releasePlayback(id: string): void {
	if (activeVideo?.id === id) {
		activeVideo = null;
	}
}
