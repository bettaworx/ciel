'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type AccountEntry = {
	userId: string;
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
	cachedUnreadCount: number;
};

export const accountsAtom = atomWithStorage<AccountEntry[]>('ciel:accounts', []);

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
