'use client';

import { atom } from 'jotai';
import type { components } from '@/lib/api/api';

type User = components['schemas']['User'];

/**
 * Authentication state using cookie-based auth.
 * SECURITY: The JWT token is stored in httpOnly cookies managed by the server.
 * We do NOT store any user data in localStorage to prevent XSS attacks.
 * All auth state is kept in memory and re-fetched from the server on page load.
 */
export type AuthState = {
	status: 'idle' | 'loading' | 'ready' | 'error';
	user: User | null;
	error: string | null;
};

const initialAuthState: AuthState = {
	status: 'idle',
	user: null,
	error: null,
};

// SECURITY: Use plain atom (memory only) instead of atomWithStorage
// This prevents XSS attacks from reading user data from localStorage
export const authAtom = atom<AuthState>(initialAuthState);

// Derived atoms
export const userAtom = atom((get) => get(authAtom).user);
export const isAuthenticatedAtom = atom((get) => !!get(authAtom).user && get(authAtom).status === 'ready');
export const authStatusAtom = atom((get) => get(authAtom).status);

// Action atoms
export const clearAuthAtom = atom(null, (get, set) => {
	set(authAtom, {
		status: 'ready',
		user: null,
		error: null,
	});
});


