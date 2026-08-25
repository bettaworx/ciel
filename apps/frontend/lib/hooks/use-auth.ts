'use client';

import { useRef } from 'react';
import { useSetAtom } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { authAtom } from '@/atoms/auth';
import { addAccountAtom } from '@/atoms/accounts';
import { createApiClient } from '@/lib/api/client';
import { getAssertion } from '@/lib/api/webauthn';
import type { components } from '@/lib/api/api';
import { computeClientProof, randomBase64Url } from '@/lib/api/scram';
import { ERROR_CODES } from '@/lib/errors';
import { getSafeRedirect } from '@/lib/utils/redirect';
import { queryKeys } from '@/lib/hooks/use-queries';

const api = createApiClient();

type MfaMethod = components['schemas']['MfaMethod'];

/**
 * SCRAM proved the password; the account may still owe a second factor.
 * `ok: 'mfa'` carries the short-lived token that binds the verified session to
 * the pending challenge — the caller shows the challenge step and finishes with
 * completeLoginMfa* / completeStepupMfa*.
 */
export type MfaChallenge = { ok: 'mfa'; mfaToken: string; methods: MfaMethod[] };
export type LoginResult = { ok: true } | { ok: false } | MfaChallenge;
export type StepupResult =
	| { ok: true; stepupToken: string; expiresInSeconds: number }
	| { ok: false }
	| MfaChallenge;

export function useAuth() {
	const setAuth = useSetAtom(authAtom);
	const addAccount = useSetAtom(addAccountAtom);
	const queryClient = useQueryClient();
	const isInitializingRef = useRef(false);

	const initAuth = async () => {
		// Guard against React Strict Mode double-invoke and concurrent calls
		if (isInitializingRef.current) return;
		isInitializingRef.current = true;

		setAuth({ status: 'loading', user: null, error: null });

		try {
			// Call /me to check if user is authenticated via cookie
			const res = await api.me();

			if (!res.ok) {
				// Not authenticated or session expired
				setAuth({ status: 'ready', user: null, error: null });
				return;
			}

			// Pre-populate React Query cache before enabling useMe() to avoid a duplicate request.
			// setQueryData must come before setAuth so the cache is ready when the
			// re-render triggered by setAuth runs and useMe() becomes enabled.
			queryClient.setQueryData(queryKeys.me, res.data);
			// User is authenticated
			setAuth({ status: 'ready', user: res.data, error: null });
		} catch (error) {
			// Network error or backend is offline
			// Set auth to ready state (unauthenticated) so the app can load
			console.error('[Auth] Failed to initialize auth:', error);
			setAuth({ status: 'ready', user: null, error: null });
		} finally {
			isInitializingRef.current = false;
		}
	};

	// Everything that happens once the server accepts a login: cache the user,
	// then hard-reload so the session cookie is picked up everywhere.
	const finishLogin = (user: components['schemas']['User']) => {
		addAccount({
			userId: user.id,
			username: user.username,
			displayName: user.displayName ?? null,
			avatarUrl: user.avatarUrl ?? null,
		});

		setAuth({ status: 'ready', user, error: null });

		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const redirect = params.get('redirect');
			window.location.href = getSafeRedirect(redirect);
		}
	};

	const login = async (username: string, password: string): Promise<LoginResult> => {
		setAuth((prev) => ({ ...prev, status: 'loading', error: null }));

		const clientNonce = randomBase64Url(16);
		const startRes = await api.loginStart({ username, clientNonce });

	if (!startRes.ok) {
		setAuth((prev) => ({ ...prev, status: 'error', error: ERROR_CODES.AUTH_LOGIN_START_FAILED }));
		return { ok: false };
	}

		const proof = await computeClientProof({
			username,
			password,
			clientNonce,
			serverNonce: startRes.data.serverNonce,
			saltB64: startRes.data.salt,
			iterations: startRes.data.iterations,
		});

		const finishRes = await api.loginFinish({
			loginSessionId: startRes.data.loginSessionId,
			clientFinalNonce: proof.clientFinalNonce,
			clientProof: proof.clientProofB64,
		});

	if (!finishRes.ok) {
		setAuth((prev) => ({ ...prev, status: 'error', error: ERROR_CODES.AUTH_LOGIN_FAILED }));
		return { ok: false };
	}

		if (finishRes.data.status === 'mfa_required') {
			// Not an error and not signed in: hand the challenge to the caller and
			// leave the atom settled so the wizard can render its next step.
			setAuth({ status: 'ready', user: null, error: null });
			return {
				ok: 'mfa',
				mfaToken: finishRes.data.mfaToken,
				methods: finishRes.data.methods,
			};
		}

		finishLogin(finishRes.data.user);
		return { ok: true };
	};

	// Second half of a login that came back mfa_required.
	const completeLoginMfa = async (
		mfaToken: string,
		code: string,
		method?: MfaMethod
	): Promise<LoginResult> => {
		const res = await api.mfaVerify({ mfaToken, code, method });
		if (!res.ok) return { ok: false };
		finishLogin(res.data.user);
		return { ok: true };
	};

	const completeLoginMfaWebAuthn = async (mfaToken: string): Promise<LoginResult> => {
		const optionsRes = await api.mfaWebauthnOptions({ mfaToken });
		if (!optionsRes.ok) return { ok: false };

		const credential = await getAssertion(optionsRes.data.options);
		const res = await api.mfaWebauthnVerify({ mfaToken, credential });
		if (!res.ok) return { ok: false };

		finishLogin(res.data.user);
		return { ok: true };
	};

	const register = async (
		username: string,
		password: string,
		termsVersion: number,
		privacyVersion: number,
		inviteCode?: string
	) => {
		setAuth((prev) => ({ ...prev, status: 'loading', error: null }));

		const registerRes = await api.register({
			username,
			password,
			termsVersion,
			privacyVersion,
			inviteCode: inviteCode || undefined,
		});

		if (!registerRes.ok) {
			setAuth((prev) => ({ ...prev, status: 'error', error: ERROR_CODES.AUTH_REGISTRATION_FAILED }));
			return { ok: false };
		}


		// Login after registration but don't reload
		const clientNonce = randomBase64Url(16);
		const startRes = await api.loginStart({ username, clientNonce });

	if (!startRes.ok) {
		setAuth((prev) => ({ ...prev, status: 'error', error: ERROR_CODES.AUTH_LOGIN_START_FAILED }));
		return { ok: false };
	}

		const proof = await computeClientProof({
			username,
			password,
			clientNonce,
			serverNonce: startRes.data.serverNonce,
			saltB64: startRes.data.salt,
			iterations: startRes.data.iterations,
		});

		const finishRes = await api.loginFinish({
			loginSessionId: startRes.data.loginSessionId,
			clientFinalNonce: proof.clientFinalNonce,
			clientProof: proof.clientProofB64,
		});

	if (!finishRes.ok) {
		setAuth((prev) => ({ ...prev, status: 'error', error: ERROR_CODES.AUTH_LOGIN_FAILED }));
		return { ok: false };
	}

		if (finishRes.data.status === 'mfa_required') {
			// Unreachable in practice — an account created seconds ago has no second
			// factor — but the response is a union, so it has to be narrowed.
			setAuth((prev) => ({ ...prev, status: 'error', error: ERROR_CODES.AUTH_LOGIN_FAILED }));
			return { ok: false };
		}

		setAuth({
			status: 'ready',
			user: finishRes.data.user,
			error: null,
		});

		return { ok: true };
	};

	// Re-authenticates the already-logged-in user and returns a short-lived,
	// single-use step-up token for one sensitive operation (password change,
	// username change, account deletion).
	//
	// Same SCRAM exchange as login. `username` must be the user's CURRENT
	// username: the server builds the auth message from the name stored in the
	// database, so a rename flow has to prove with the old name.
	const stepup = async (username: string, password: string): Promise<StepupResult> => {
		const clientNonce = randomBase64Url(16);
		const startRes = await api.stepupStart({ clientNonce });

		if (!startRes.ok) {
			return { ok: false as const };
		}

		const proof = await computeClientProof({
			username,
			password,
			clientNonce,
			serverNonce: startRes.data.serverNonce,
			saltB64: startRes.data.salt,
			iterations: startRes.data.iterations,
		});

		const finishRes = await api.stepupFinish({
			stepupSessionId: startRes.data.stepupSessionId,
			clientFinalNonce: proof.clientFinalNonce,
			clientProof: proof.clientProofB64,
		});

		if (!finishRes.ok) {
			return { ok: false };
		}

		if (finishRes.data.status === 'mfa_required') {
			return {
				ok: 'mfa',
				mfaToken: finishRes.data.mfaToken,
				methods: finishRes.data.methods,
			};
		}

		return {
			ok: true,
			stepupToken: finishRes.data.stepupToken,
			expiresInSeconds: finishRes.data.expiresInSeconds,
		};
	};

	// Second half of a step-up that came back mfa_required.
	const completeStepupMfa = async (
		mfaToken: string,
		code: string,
		method?: MfaMethod
	): Promise<StepupResult> => {
		const res = await api.stepupMfaVerify({ mfaToken, code, method });
		if (!res.ok) return { ok: false };
		return {
			ok: true,
			stepupToken: res.data.stepupToken,
			expiresInSeconds: res.data.expiresInSeconds,
		};
	};

	const completeStepupMfaWebAuthn = async (mfaToken: string): Promise<StepupResult> => {
		const optionsRes = await api.stepupMfaWebauthnOptions({ mfaToken });
		if (!optionsRes.ok) return { ok: false };

		const credential = await getAssertion(optionsRes.data.options);
		const res = await api.stepupMfaWebauthnVerify({ mfaToken, credential });
		if (!res.ok) return { ok: false };

		return {
			ok: true,
			stepupToken: res.data.stepupToken,
			expiresInSeconds: res.data.expiresInSeconds,
		};
	};

	const logout = async () => {
		setAuth((prev) => ({ ...prev, status: 'loading', error: null }));

		await api.logout();

		setAuth({ status: 'ready', user: null, error: null });

		// Reload page to ensure session is properly destroyed
		if (typeof window !== 'undefined') {
			window.location.href = '/';
		}
	};

	return {
		initAuth,
		login,
		completeLoginMfa,
		completeLoginMfaWebAuthn,
		register,
		stepup,
		completeStepupMfa,
		completeStepupMfaWebAuthn,
		logout,
	};
}
