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

/**
 * The switcher's order: most recently used first, so the account you keep
 * coming back to is the one under your thumb.
 */
export const orderedAccountsAtom = atom((get) =>
	[...get(accountsAtom)].sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0))
);

/**
 * Adds an account, or refreshes the profile of one already listed. The switcher
 * is the only place these names and avatars are shown, so nothing else would
 * ever notice they had gone stale.
 */
export const upsertAccountAtom = atom(null, (get, set, account: Omit<AccountEntry, 'cachedUnreadCount'>) => {
	const current = get(accountsAtom);
	if (current.some((a) => a.userId === account.userId)) {
		set(accountsAtom, current.map((a) => (a.userId === account.userId ? { ...a, ...account } : a)));
		return;
	}
	set(accountsAtom, [...current, { ...account, cachedUnreadCount: 0 }]);
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
