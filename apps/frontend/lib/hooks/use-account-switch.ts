'use client';

import { useAtomValue, useSetAtom, useStore } from 'jotai';
import { accountsAtom, pickNextAccounts, removeAccountAtom, type AccountEntry } from '@/atoms/accounts';
import { createApiClient } from '@/lib/api/client';
import { deleteAccountToken, loadAccountToken, saveAccountToken, signExchange } from '@/lib/auth/account-tokens';

const api = createApiClient();

/**
 * Everything that moves the browser from one signed-in account to another.
 *
 * The stored token only becomes a session on the server, and only alongside a
 * signature from this device's key; every failure path drops the stored token
 * and falls back to the password login for that username.
 */
export function useAccountSwitch() {
	const store = useStore();
	const removeAccount = useSetAtom(removeAccountAtom);

	// Subscribing is what mounts the atom and pulls the list out of storage; the
	// list itself is read off the store at call time instead, because a switch
	// happens after awaits that the render closure predates.
	useAtomValue(accountsAtom);

	// Every terminus here is a full load, never a router push: the session
	// cookies just changed (or died) and every cache in the app still belongs to
	// the account we are leaving.
	const promptLogin = (username: string) => {
		window.location.href = `/login?username=${encodeURIComponent(username)}`;
	};

	const goHome = () => {
		window.location.href = '/';
	};

	/**
	 * Spends this account's stored token on a session. A token that does not
	 * work is dropped, so the next attempt goes straight to the password login
	 * instead of retrying something the server has already refused.
	 */
	const activate = async (userId: string): Promise<boolean> => {
		const token = await loadAccountToken(userId);
		if (!token) return false;

		const res = await api.sessionExchange({ token, ...(await signExchange(token)), activate: true });
		if (!res.ok || !res.data.token) {
			await deleteAccountToken(userId);
			return false;
		}

		// The switch consumed the token; keep its replacement so this account can
		// be switched back to later.
		await saveAccountToken(userId, res.data.token);
		return true;
	};

	/** The switcher's own rows: one account, picked deliberately. */
	const switchTo = async (account: AccountEntry) => {
		if (await activate(account.userId)) {
			goHome();
			return;
		}
		promptLogin(account.username);
	};

	/**
	 * Drops an account this browser can no longer be — logged out, deleted — so
	 * the switcher stops offering a row that leads nowhere. Navigates nowhere
	 * itself; pair it with switchToNext.
	 */
	const forgetAccount = async (userId: string) => {
		await deleteAccountToken(userId);
		removeAccount(userId);
	};

	/**
	 * Falls through to whichever account was used most recently.
	 *
	 * Candidates are tried in turn: a dead token on the first one is no reason
	 * to strand the user on a login screen while a working account sits below
	 * it. Returns false when there was nobody to fall through to, leaving the
	 * caller to decide what a browser with no accounts left should show.
	 */
	const switchToNext = async (excludeIds: string[] = []): Promise<boolean> => {
		const candidates = pickNextAccounts(store.get(accountsAtom), excludeIds);
		for (const candidate of candidates) {
			if (await activate(candidate.userId)) {
				goHome();
				return true;
			}
		}

		// Every remaining token is gone, but the accounts themselves are still
		// the user's: offer the most recent one a password login rather than a
		// blank signed-out screen.
		if (candidates.length > 0) {
			promptLogin(candidates[0].username);
			return true;
		}
		return false;
	};

	return { switchTo, forgetAccount, switchToNext };
}
