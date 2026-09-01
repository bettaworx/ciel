'use client';

import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { accountsAtom, refreshAccountAtom, updateCachedUnreadAtom } from '@/atoms/accounts';
import { userAtom } from '@/atoms/auth';
import { createApiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/api';
import { deleteAccountToken, loadAccountToken, signExchange } from '@/lib/auth/account-tokens';

const api = createApiClient();

type User = components['schemas']['User'];

/**
 * Polled rather than pushed: the realtime socket authenticates from the
 * ciel_auth cookie alone (handlers/realtime.go deliberately dropped query
 * parameter auth), so a background account has no way to open one. This is as
 * close to live as the accounts you are not signed in as can get.
 */
const POLL_MS = 20_000;

/**
 * Access tokens for the other accounts, in memory only — they are never
 * written to disk. Caching them keeps a poll down to one request per account
 * instead of re-proving possession of the device key every 20 seconds.
 */
const accessTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * Returns an access token for another account, and — when it had to prove
 * possession to get one — that account's current profile, which the switcher
 * would otherwise keep showing from whenever the account was added.
 */
async function accessTokenFor(userId: string): Promise<{ accessToken: string; user?: User } | null> {
	const cached = accessTokens.get(userId);
	// Renew a little early so a poll never starts with a token about to expire.
	if (cached && cached.expiresAt > Date.now() + 30_000) return { accessToken: cached.token };

	const stored = await loadAccountToken(userId);
	if (!stored) return null;

	const res = await api.sessionExchange({ token: stored, ...(await signExchange(stored)) });
	if (!res.ok) {
		// Revoked, expired, or bound to a key this browser no longer has: the row
		// stays in the switcher, but it now leads to a password login.
		if (res.status === 401) await deleteAccountToken(userId);
		accessTokens.delete(userId);
		return null;
	}
	accessTokens.set(userId, {
		token: res.data.accessToken,
		expiresAt: Date.now() + res.data.expiresInSeconds * 1000,
	});
	return { accessToken: res.data.accessToken, user: res.data.user };
}

/**
 * Keeps the unread badge on every account the user is not currently looking at.
 *
 * Reads never rotate the account token: several tabs poll at once, and a
 * rotation race there would revoke a perfectly good account.
 */
export function useAccountUnread() {
	const accounts = useAtomValue(accountsAtom);
	const activeUser = useAtomValue(userAtom);
	const updateCachedUnread = useSetAtom(updateCachedUnreadAtom);
	// Refresh, never insert: a poll started before a switch can resolve after the
	// account it asked about was dropped, and an upsert would list it again.
	const refreshAccount = useSetAtom(refreshAccountAtom);

	const others = accounts.filter((account) => account.userId !== activeUser?.id);

	useQuery({
		queryKey: ['accountUnread', others.map((account) => account.userId)],
		enabled: others.length > 0,
		refetchInterval: POLL_MS,
		queryFn: async () => {
			await Promise.allSettled(
				others.map(async (account) => {
					const session = await accessTokenFor(account.userId);
					if (!session) return;

					if (session.user) {
						refreshAccount({
							userId: account.userId,
							username: session.user.username,
							displayName: session.user.displayName ?? null,
							avatarUrl: session.user.avatarUrl ?? null,
						});
					}

					const unread = await api.unreadNotificationCountAs(session.accessToken);
					if (!unread.ok) {
						// Most likely revoked mid-flight; drop it and re-prove next tick.
						if (unread.status === 401) accessTokens.delete(account.userId);
						return;
					}
					updateCachedUnread({ userId: account.userId, count: unread.data.count });
				})
			);
			return null;
		},
	});
}
