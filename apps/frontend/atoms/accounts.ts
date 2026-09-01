'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type AccountEntry = {
	userId: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	cachedUnreadCount: number;
	/** Epoch ms of the last page load with this account signed in. Absent on entries added before ordering existed. */
	lastActiveAt?: number;
};

export const accountsAtom = atomWithStorage<AccountEntry[]>('ciel:accounts', []);

/** Most recently used first. */
function byLastActive(accounts: AccountEntry[]): AccountEntry[] {
	return [...accounts].sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0));
}

/**
 * The switcher's order: most recently used first, so the account you keep
 * coming back to is the one under your thumb.
 */
export const orderedAccountsAtom = atom((get) => byLastActive(get(accountsAtom)));

/**
 * The accounts to fall through to when a session ends, best first.
 *
 * The ids to leave out are passed in rather than read back off the atom: the
 * caller has just removed the account it is leaving, and its own copy of the
 * list is a render behind.
 */
export function pickNextAccounts(accounts: AccountEntry[], excludeIds: string[]): AccountEntry[] {
	return byLastActive(accounts).filter((a) => !excludeIds.includes(a.userId));
}

/**
 * Refreshes the profile of an account already listed, and adds nothing. The
 * unread poll runs against a list that may have lost a row while a request was
 * in flight, and an upsert there would put that row straight back.
 */
export function refreshAccount(
	accounts: AccountEntry[],
	account: Omit<AccountEntry, 'cachedUnreadCount'>
): AccountEntry[] {
	if (!accounts.some((a) => a.userId === account.userId)) return accounts;
	return accounts.map((a) => (a.userId === account.userId ? { ...a, ...account } : a));
}

/**
 * Adds an account, or refreshes the profile of one already listed. The switcher
 * is the only place these names and avatars are shown, so nothing else would
 * ever notice they had gone stale.
 */
export const upsertAccountAtom = atom(null, (get, set, account: Omit<AccountEntry, 'cachedUnreadCount'>) => {
	const current = get(accountsAtom);
	if (current.some((a) => a.userId === account.userId)) {
		set(accountsAtom, refreshAccount(current, account));
		return;
	}
	set(accountsAtom, [...current, { ...account, cachedUnreadCount: 0 }]);
});

/** Profile refresh for an account already listed; a no-op for anything else. */
export const refreshAccountAtom = atom(null, (get, set, account: Omit<AccountEntry, 'cachedUnreadCount'>) => {
	set(accountsAtom, refreshAccount(get(accountsAtom), account));
});

/**
 * Stamps an account as the one currently in use. Called on every load of a
 * signed-in page, which is exactly what "last accessed" means.
 */
export const markAccountActiveAtom = atom(null, (get, set, userId: string) => {
	set(
		accountsAtom,
		get(accountsAtom).map((a) => (a.userId === userId ? { ...a, lastActiveAt: Date.now() } : a))
	);
});

export const removeAccountAtom = atom(null, (get, set, userId: string) => {
	set(accountsAtom, get(accountsAtom).filter((a) => a.userId !== userId));
});

export const updateCachedUnreadAtom = atom(
	null,
	(get, set, { userId, count }: { userId: string; count: number }) => {
		set(
			accountsAtom,
			get(accountsAtom).map((a) => (a.userId === userId ? { ...a, cachedUnreadCount: count } : a))
		);
	}
);
