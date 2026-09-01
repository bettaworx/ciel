'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/atoms/auth';
import { queryKeys, useMarkNotificationsRead } from '@/lib/hooks/use-queries';
import { useActivityTracker } from '@/lib/hooks/use-activity-tracker';
import { WebSocketDisconnectAlert } from '@/components/realtime/WebSocketDisconnectAlert';
import { NotificationRow } from '@/components/notifications/NotificationRow';
import { notificationTargetPostId } from '@/lib/notifications';
import { resolveWebSocketUrl } from '@/lib/api/base-url';
import { cacheHoldsAuthor } from '@/lib/moderation/cache-holds-author';
import {
	mergeReactionCountsForCurrentUser,
	reactionSelfQueryKey,
	reactedEmojiList,
	type ReactionCount,
} from '@/lib/reactions';
import type { components } from '@/lib/api/api';

type Post = components['schemas']['Post'];
type PostId = components['schemas']['PostId'];
type UserId = components['schemas']['UserId'];
type ReactionCounts = components['schemas']['ReactionCounts'];
type ServerInfo = components['schemas']['ServerInfo'];
type ServerConfig = components['schemas']['ServerConfig'];
type Notification = components['schemas']['Notification'];

type RealtimeEvent =
	| { type: 'post_created'; post: Post }
	| { type: 'post_deleted'; postId: PostId }
	| { type: 'reaction_updated'; reactionCounts: ReactionCounts }
	| { type: 'user_registered' }
	| { type: 'user_deleted' }
	| { type: 'user_privacy_changed'; username: string }
	| { type: 'server_info_updated'; serverInfo: ServerInfo }
	| { type: 'server_config_updated'; serverConfig: ServerConfig }
	| { type: 'notification_created'; notification: Notification; targetUserId: UserId };

interface RealtimeProviderProps {
	children: React.ReactNode;
}

/** How many recently handled notification ids to remember for de-duplication. */
const MAX_TRACKED_NOTIFICATION_IDS = 100;

export function RealtimeProvider({ children }: RealtimeProviderProps) {
	const queryClient = useQueryClient();
	const user = useAtomValue(userAtom);
	const router = useRouter();
	const pathname = usePathname();
	// Read through a ref so the WebSocket handlers are not rebuilt on navigation.
	const isOnNotificationsPageRef = useRef(false);
	isOnNotificationsPageRef.current = pathname === '/notifications';
	const handledNotificationIdsRef = useRef<Set<string>>(new Set());
	// `connect` is rebuilt whenever the message handlers change, and every rebuild
	// tears down and reopens the socket. Keep the router out of the dependency
	// chain so a re-render cannot leave two sockets open at once.
	const routerRef = useRef(router);
	routerRef.current = router;
	const markNotificationsRead = useMarkNotificationsRead();
	const markNotificationsReadRef = useRef(markNotificationsRead);
	markNotificationsReadRef.current = markNotificationsRead;
	const wsRef = useRef<WebSocket | null>(null);
	/** Tears down the current socket without triggering its reconnect path. */
	const disposeRef = useRef<(() => void) | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const inactivityDisconnectRef = useRef(false);
	const hasConnectedRef = useRef(false);
	const [showInactivityAlert, setShowInactivityAlert] = useState(false);

	const removePostFromCache = useCallback((postId: PostId, payload: unknown) => {
		if (!payload || typeof payload !== 'object') {
			return payload;
		}
		const typed = payload as { pages?: Array<{ items?: Post[] }> };
		if (!Array.isArray(typed.pages)) {
			return payload;
		}
		let changed = false;
		const pages = typed.pages.map((page) => {
			if (!page || !Array.isArray(page.items)) {
				return page;
			}
			const items = page.items.filter((item) => item?.id !== postId);
			if (items.length !== page.items.length) {
				changed = true;
				return { ...page, items };
			}
			return page;
		});
		if (!changed) {
			return payload;
		}
		return { ...(typed as object), pages };
	}, []);

	const removePostFromList = useCallback((postId: PostId, payload: unknown) => {
		if (!payload || typeof payload !== 'object') {
			return payload;
		}
		const typed = payload as { items?: Post[] };
		if (!Array.isArray(typed.items)) {
			return payload;
		}
		const items = typed.items.filter((item) => item?.id !== postId);
		if (items.length === typed.items.length) {
			return payload;
		}
		return { ...(typed as object), items };
	}, []);

	const applyReactionsToPost = useCallback((
		counts: ReactionCounts,
		post: Post,
		selfEmojis: readonly string[],
	): Post => ({
		...post,
		reactions: mergeReactionCountsForCurrentUser(
			counts,
			[...selfEmojis, ...reactedEmojiList(post.reactions)],
			{ trustServerStatus: false },
		).reactions,
	}), []);

	const applyReactionsToCache = useCallback((
		counts: ReactionCounts,
		payload: unknown,
		selfEmojis: readonly string[],
	) => {
		if (!payload || typeof payload !== 'object') {
			return payload;
		}
		const maybePost = payload as Post;
		if (maybePost.id === counts.postId) {
			return applyReactionsToPost(counts, maybePost, selfEmojis);
		}
		const typed = payload as { pages?: Array<{ items?: Post[] }>; items?: Post[] };
		if (Array.isArray(typed.pages)) {
			let changed = false;
			const pages = typed.pages.map((page) => {
				if (!page || !Array.isArray(page.items)) {
					return page;
				}
				const items = page.items.map((item) => {
					if (item?.id !== counts.postId) {
						return item;
					}
					changed = true;
					return applyReactionsToPost(counts, item, selfEmojis);
				});
				return changed ? { ...page, items } : page;
			});
			return changed ? { ...(typed as object), pages } : payload;
		}
		if (Array.isArray(typed.items)) {
			let changed = false;
			const items = typed.items.map((item) => {
				if (item?.id !== counts.postId) {
					return item;
				}
				changed = true;
				return applyReactionsToPost(counts, item, selfEmojis);
			});
			return changed ? { ...(typed as object), items } : payload;
		}
		return payload;
	}, [applyReactionsToPost]);

	const getKnownSelfEmojis = useCallback((postId: PostId) => {
		if (!user?.id) {
			return [];
		}
		const selfEmojis = queryClient.getQueryData<string[]>(
			reactionSelfQueryKey(postId, user.id),
		) ?? [];
		const directReactions = queryClient.getQueryData<ReactionCount[]>(
			['posts', postId, 'reactions'],
		);
		const counts = queryClient.getQueryData<ReactionCounts>(
			queryKeys.reactions(postId),
		);

		return Array.from(new Set([
			...selfEmojis,
			...reactedEmojiList(directReactions),
			...reactedEmojiList(counts?.reactions),
		]));
	}, [queryClient, user?.id]);

	const handlePostCreated = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
		queryClient.invalidateQueries({
			predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'userPosts',
		});
		// Increment postCount locally — avoids an extra REST call
		queryClient.setQueryData(queryKeys.serverInfo, (old: ServerInfo | undefined) => {
			if (!old) return old;
			return { ...old, stats: { ...old.stats, postCount: old.stats.postCount + 1 } };
		});
	}, [queryClient]);

	const nullifyReference = useCallback((deletedPostId: PostId, payload: unknown) => {
		if (!payload || typeof payload !== 'object') return payload;
		const typed = payload as { pages?: Array<{ items?: Post[] }>; items?: Post[] };
		if (Array.isArray(typed.pages)) {
			let anyChanged = false;
			const pages = typed.pages.map((page) => {
				if (!page || !Array.isArray(page.items)) return page;
				let pageChanged = false;
				const items = page.items.map((item) => {
					if (item?.referenceId !== deletedPostId || !item.reference) return item;
					pageChanged = true;
					return { ...item, reference: null };
				});
				if (!pageChanged) return page;
				anyChanged = true;
				return { ...page, items };
			});
			return anyChanged ? { ...(typed as object), pages } : payload;
		}
		if (Array.isArray(typed.items)) {
			let changed = false;
			const items = typed.items.map((item) => {
				if (item?.referenceId !== deletedPostId || !item.reference) return item;
				changed = true;
				return { ...item, reference: null };
			});
			return changed ? { ...(typed as object), items } : payload;
		}
		return payload;
	}, []);

	const handlePostDeleted = useCallback((postId: PostId) => {
		queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
		queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
		queryClient.invalidateQueries({
			predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'userPosts',
		});
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'timeline' },
			(payload) => removePostFromCache(postId, payload)
		);
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'userPosts' },
			(payload) => removePostFromCache(postId, payload)
		);
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'timeline' },
			(payload) => removePostFromList(postId, payload)
		);
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'userPosts' },
			(payload) => removePostFromList(postId, payload)
		);
		// Null out reference on posts that referenced the deleted post
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'timeline' },
			(payload) => nullifyReference(postId, payload)
		);
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'userPosts' },
			(payload) => nullifyReference(postId, payload)
		);
		// Decrement postCount locally
		queryClient.setQueryData(queryKeys.serverInfo, (old: ServerInfo | undefined) => {
			if (!old) return old;
			return { ...old, stats: { ...old.stats, postCount: Math.max(0, old.stats.postCount - 1) } };
		});
	}, [queryClient, removePostFromCache, removePostFromList, nullifyReference]);

	const handleReactionUpdated = useCallback((counts: ReactionCounts) => {
		const selfEmojis = getKnownSelfEmojis(counts.postId);
		const adjustedReactionCounts = mergeReactionCountsForCurrentUser(
			counts,
			selfEmojis,
			{ trustServerStatus: false },
		);
		queryClient.setQueryData(queryKeys.reactions(counts.postId), adjustedReactionCounts);
		queryClient.setQueryData(['posts', counts.postId, 'reactions'], adjustedReactionCounts.reactions);
		queryClient.setQueryData(
			queryKeys.post(counts.postId),
			(payload) => applyReactionsToCache(counts, payload, selfEmojis),
		);
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'timeline' },
			(payload) => applyReactionsToCache(counts, payload, selfEmojis)
		);
		queryClient.setQueriesData(
			{ predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'userPosts' },
			(payload) => applyReactionsToCache(counts, payload, selfEmojis)
		);
	}, [queryClient, applyReactionsToCache, getKnownSelfEmojis]);

	const handleUserRegistered = useCallback(() => {
		queryClient.setQueryData(queryKeys.serverInfo, (old: ServerInfo | undefined) => {
			if (!old) return old;
			return { ...old, stats: { ...old.stats, userCount: old.stats.userCount + 1 } };
		});
	}, [queryClient]);

	const handleUserDeleted = useCallback(() => {
		queryClient.setQueryData(queryKeys.serverInfo, (old: ServerInfo | undefined) => {
			if (!old) return old;
			return { ...old, stats: { ...old.stats, userCount: Math.max(0, old.stats.userCount - 1) } };
		});
	}, [queryClient]);

	// An account switched between public and private. Everything this client is
	// holding about them was fetched under the old setting, so it is dropped
	// rather than trusted for the rest of the cache lifetime. The server is
	// already refusing it; this only stops an open tab from carrying on showing
	// what it fetched a moment ago.
	const handleUserPrivacyChanged = useCallback((username: string) => {
		queryClient.invalidateQueries({ queryKey: queryKeys.user(username) });
		queryClient.invalidateQueries({ queryKey: queryKeys.userPosts(username) });
		// Timelines and posts are dropped only where this account actually
		// appears. This event is broadcast to everyone connected, and a blanket
		// invalidation meant one person toggling their privacy setting made every
		// open tab on the server refetch its whole timeline at once. Almost none
		// of those timelines contained the account in question.
		queryClient.invalidateQueries({
			queryKey: queryKeys.timeline,
			predicate: (query) => cacheHoldsAuthor(query.state.data, username),
		});
		queryClient.invalidateQueries({
			queryKey: ['post'],
			predicate: (query) => cacheHoldsAuthor(query.state.data, username),
		});
		// Follow lists are keyed by whose list it is, so this one needs no data:
		// only their own lists can gain or lose the pending requests that turning
		// privacy off accepts.
		queryClient.invalidateQueries({
			queryKey: queryKeys.follows,
			predicate: (query) => query.queryKey[1] === username,
		});
		// Left whole. It is one list per client rather than a page of infinite
		// scroll, and whether a notification survives depends on the actor, which
		// the cached shape does not always name.
		queryClient.invalidateQueries({ queryKey: ['notifications'] });
	}, [queryClient]);

	const handleServerInfoUpdated = useCallback((info: ServerInfo) => {
		// Merge pushed info but keep locally-tracked stats so we don't clobber incremental counts
		queryClient.setQueryData(queryKeys.serverInfo, (old: ServerInfo | undefined) => ({
			...info,
			stats: old?.stats ?? info.stats,
		}));
	}, [queryClient]);

	const handleServerConfigUpdated = useCallback((serverConfig: ServerConfig) => {
		queryClient.setQueryData(queryKeys.serverConfig, serverConfig);
	}, [queryClient]);

	const handleNotificationCreated = useCallback((notification: Notification) => {
		// A single page can briefly hold more than one socket (reconnects, React
		// strict-mode remounts), so the same event can arrive twice. Deliver each
		// notification's side effects once.
		if (handledNotificationIdsRef.current.has(notification.id)) {
			return;
		}
		handledNotificationIdsRef.current.add(notification.id);
		if (handledNotificationIdsRef.current.size > MAX_TRACKED_NOTIFICATION_IDS) {
			const oldest = handledNotificationIdsRef.current.values().next().value;
			if (oldest) handledNotificationIdsRef.current.delete(oldest);
		}

		// Refetch rather than incrementing locally: the server owns the count, so
		// a duplicate delivery or a read from another tab cannot skew the badge.
		queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
		queryClient.invalidateQueries({
			predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'notifications',
		});

		// The list is already on screen; a toast for it would just be noise.
		if (isOnNotificationsPageRef.current) {
			return;
		}

		const targetPostId = notificationTargetPostId(notification);
		// A notification with no post is a follow. Unlike the list row — which is
		// grouped and so opens your followers list — a toast is always one actor,
		// so open that person's profile.
		const href = targetPostId
			? `/posts/${targetPostId}`
			: notification.actor
				? `/users/${encodeURIComponent(notification.actor.username)}`
				: '/notifications';

		// toast.custom so the whole surface is clickable, not just an action button.
		// The body is the same row the notifications list renders, so the two
		// presentations cannot drift apart.
		//
		// No surface or padding classes here: sonner renders this inside the toast
		// element, which already carries them via the Toaster's `classNames.toast`.
		toast.custom(
			(id) => (
				<button
					type="button"
					onClick={() => {
						toast.dismiss(id);
						// Acting on the toast counts as having seen it.
						markNotificationsReadRef.current.mutate([notification.id]);
						routerRef.current.push(href);
					}}
					className="block w-full text-left"
				>
					{/* One event, one actor: never the grouped layout. */}
					<NotificationRow
						notification={notification}
						showTimestamp={false}
						singleActor
						className="p-0"
					/>
				</button>
			),
			// A pushed notification is unread by definition, so carry the same
			// highlight the list uses.
			{ classNames: { toast: 'notification-unread-tint' } },
		);
	}, [queryClient]);

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			try {
				const data: RealtimeEvent = JSON.parse(event.data);
				switch (data.type) {
					case 'post_created':
						handlePostCreated();
						break;

					case 'post_deleted':
						handlePostDeleted(data.postId);
						break;

					case 'reaction_updated':
						handleReactionUpdated(data.reactionCounts);
						break;

					case 'user_registered':
						handleUserRegistered();
						break;

					case 'user_deleted':
						handleUserDeleted();
						break;

					case 'user_privacy_changed':
						handleUserPrivacyChanged(data.username);
						break;

					case 'server_info_updated':
						handleServerInfoUpdated(data.serverInfo);
						break;

					case 'server_config_updated':
						handleServerConfigUpdated(data.serverConfig);
						break;

					case 'notification_created':
						handleNotificationCreated(data.notification);
						break;
				}
			} catch (err) {
				console.error('Failed to parse WebSocket message:', err);
			}
		},
		[handlePostCreated, handlePostDeleted, handleReactionUpdated, handleUserRegistered, handleUserDeleted, handleUserPrivacyChanged, handleServerInfoUpdated, handleServerConfigUpdated, handleNotificationCreated]
	);

	const connect = useCallback(() => {
		if (typeof window === 'undefined') return;

		// Never run two sockets at once: every extra socket delivers every event
		// again, which shows duplicate notifications.
		const existing = wsRef.current;
		if (
			existing &&
			(existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
		) {
			return;
		}

		const wsUrl = resolveWebSocketUrl();

		try {
			// Note: WebSocket automatically sends cookies (including httpOnly cookies)
			// for same-origin connections, providing cookie-based authentication
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			// Tracked per socket rather than in a ref: a shared flag would be reset
			// by the next connect() before this socket's onclose had run.
			let disposed = false;
			disposeRef.current = () => {
				disposed = true;
				ws.onclose = null;
				ws.onmessage = null;
				ws.close();
				if (wsRef.current === ws) wsRef.current = null;
			};

			ws.onopen = () => {
				reconnectAttemptsRef.current = 0;
				if (hasConnectedRef.current) {
					// Reconnect only: re-sync server data that may have changed while disconnected
					queryClient.invalidateQueries({ queryKey: queryKeys.serverInfo });
					queryClient.invalidateQueries({ queryKey: queryKeys.serverConfig });
				}
				hasConnectedRef.current = true;
			};

			ws.onmessage = handleMessage;


			ws.onerror = () => {
				// Errors are handled in onclose
			};

			ws.onclose = () => {
				if (wsRef.current === ws) {
					wsRef.current = null;
				}

				// We closed this socket ourselves (unmount / reconnect); reconnecting
				// here would leave an orphaned socket behind for every remount.
				if (disposed) {
					return;
				}

				// Don't reconnect if disconnection was due to inactivity
				if (inactivityDisconnectRef.current) {
					return;
				}

				// Exponential backoff reconnection
				const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
				reconnectAttemptsRef.current += 1;

				reconnectTimeoutRef.current = setTimeout(() => {
					connect();
				}, delay);
			};
		} catch (err) {
			console.error('Failed to create WebSocket:', err);
		}
	}, [handleMessage, queryClient]);

	// Handle user inactivity - disconnect WebSocket and show alert
	const handleInactivity = useCallback(() => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			return;
		}

		console.log('⏱️ User inactive for 5 minutes, disconnecting WebSocket...');

		// Set flag to prevent automatic reconnection
		inactivityDisconnectRef.current = true;

		// Close WebSocket connection
		wsRef.current.close();

		// Show inactivity alert
		setShowInactivityAlert(true);
	}, []);

	// Set up activity tracking
	useActivityTracker(handleInactivity);

	// Handle reconnect button click - reconnect WebSocket without reloading
	const handleReconnect = useCallback(() => {
		// Reset inactivity flag and hide alert
		inactivityDisconnectRef.current = false;
		setShowInactivityAlert(false);

		// Reconnect WebSocket
		connect();
	}, [connect]);

	useEffect(() => {
		// Reset inactivity flag when reconnecting
		inactivityDisconnectRef.current = false;
		setShowInactivityAlert(false);
		connect();

		return () => {
			// Reset so the next mount's first connect is treated as initial (not reconnect).
			// This handles React Strict Mode double-invocation and real remounts alike.
			hasConnectedRef.current = false;
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			// Dispose rather than close(): a bare close() fires onclose, which would
			// schedule a reconnect after this cleanup has already run.
			disposeRef.current?.();
			disposeRef.current = null;
		};
	}, [connect]);

	return (
		<>
			{children}
			<WebSocketDisconnectAlert
				open={showInactivityAlert}
				onOpenChange={setShowInactivityAlert}
				onReconnect={handleReconnect}
			/>
		</>
	);
}
