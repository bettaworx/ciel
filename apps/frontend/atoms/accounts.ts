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

export const addAccountAtom = atom(null, (get, set, account: Omit<AccountEntry, 'cachedUnreadCount'>) => {
	const current = get(accountsAtom);
	if (current.some((a) => a.userId === account.userId)) return;
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
