'use client';

import { useRouter } from 'next/navigation';
import type { AccountEntry } from '@/atoms/accounts';
import { createApiClient } from '@/lib/api/client';
import { deleteAccountToken, loadAccountToken, saveAccountToken, signExchange } from '@/lib/auth/account-tokens';

const api = createApiClient();

/**
 * Switches the browser to another signed-in account.
 *
 * The stored token only becomes a session on the server, and only alongside a
 * signature from this device's key; every failure path drops the stored token
 * and falls back to the password login for that username.
 */
export function useAccountSwitch() {
	const router = useRouter();

	const promptLogin = (username: string) => {
		router.push(`/login?username=${encodeURIComponent(username)}`);
	};

	const switchTo = async (account: AccountEntry) => {
		const token = await loadAccountToken(account.userId);
		if (!token) {
			promptLogin(account.username);
			return;
		}

		const res = await api.sessionExchange({ token, ...(await signExchange(token)), activate: true });
		if (!res.ok || !res.data.token) {
			await deleteAccountToken(account.userId);
			promptLogin(account.username);
			return;
		}

		// The switch consumed the token; keep its replacement so this account can
		// be switched back to later.
		await saveAccountToken(account.userId, res.data.token);

		// Hard reload rather than a router push: the session cookies just changed
		// and every cache in the app is still the previous account's.
		window.location.href = '/';
	};

	return { switchTo };
}
