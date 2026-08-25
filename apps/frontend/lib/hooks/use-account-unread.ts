'use client';

import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { accountsAtom, updateCachedUnreadAtom, upsertAccountAtom } from '@/atoms/accounts';
import { userAtom } from '@/atoms/auth';
import { createApiClient } from '@/lib/api/client';
import { deleteAccountToken, loadAccountToken, signExchange } from '@/lib/auth/account-tokens';

const api = createApiClient();

/**
 * Fills in the unread badge shown next to every account the user is not
 * currently looking at.
 *
 * Runs only while the menu is open, and reads without rotating the account
 * token: two tabs opening the menu at once must not fight over it.
 */
export function useAccountUnread(enabled: boolean) {
	const accounts = useAtomValue(accountsAtom);
	const activeUser = useAtomValue(userAtom);
	const updateCachedUnread = useSetAtom(updateCachedUnreadAtom);
	const upsertAccount = useSetAtom(upsertAccountAtom);

	const others = accounts.filter((account) => account.userId !== activeUser?.id);

	useQuery({
		queryKey: ['accountUnread', others.map((account) => account.userId)],
		enabled: enabled && others.length > 0,
		staleTime: 60_000,
		queryFn: async () => {
			await Promise.allSettled(
				others.map(async (account) => {
					const token = await loadAccountToken(account.userId);
					if (!token) return;

					const session = await api.sessionExchange({ token, ...(await signExchange(token)) });
					if (!session.ok) {
						// Revoked, expired, or bound to a key this browser no longer
						// has: the row stays, but it now leads to a password login.
						if (session.status === 401) await deleteAccountToken(account.userId);
						return;
					}

					// The profile came along for free; a stale avatar in the switcher
					// is the kind of thing nothing else would ever refresh.
					upsertAccount({
						userId: account.userId,
						username: session.data.user.username,
						displayName: session.data.user.displayName ?? null,
						avatarUrl: session.data.user.avatarUrl ?? null,
					});

					const unread = await api.unreadNotificationCountAs(session.data.accessToken);
					if (unread.ok) updateCachedUnread({ userId: account.userId, count: unread.data.count });
				})
			);
			return null;
		},
	});
}
