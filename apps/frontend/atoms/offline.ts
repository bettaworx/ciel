'use client';

import { atom } from 'jotai';

/**
 * Server offline state.
 * This atom tracks whether the server is currently offline (unreachable).
 * When true, the user should be redirected to the /offline page.
 */
export const isServerOfflineAtom = atom<boolean>(false);
