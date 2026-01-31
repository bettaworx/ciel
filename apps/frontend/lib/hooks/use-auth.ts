'use client';

import { useSetAtom } from 'jotai';
import { authAtom } from '@/atoms/auth';
import { createApiClient } from '@/lib/api/client';
import { computeClientProof, randomBase64Url } from '@/lib/api/scram';
import { ERROR_CODES } from '@/lib/errors';
import { getSafeRedirect } from '@/lib/utils/redirect';

const api = createApiClient();

export function useAuth() {
	const setAuth = useSetAtom(authAtom);

	const initAuth = async () => {
		setAuth({ status: 'loading', user: null, error: null });

		// Call /me to check if user is authenticated via cookie
		const res = await api.me();

		if (!res.ok) {
			// Not authenticated or session expired
			setAuth({ status: 'ready', user: null, error: null });
			return;
		}

		// User is authenticated
		setAuth({ status: 'ready', user: res.data, error: null });
	};

	const login = async (username: string, password: string) => {
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

		setAuth({
			status: 'ready',
			user: finishRes.data.user,
			error: null,
		});

		// Reload page to ensure session is properly initialized
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const redirect = params.get('redirect');
			window.location.href = getSafeRedirect(redirect);
		}

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

		setAuth({
			status: 'ready',
			user: finishRes.data.user,
			error: null,
		});

		return { ok: true };
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
		register,
		logout,
	};
}
