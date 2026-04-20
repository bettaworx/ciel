'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/atoms/auth';
import { queryKeys } from '@/lib/hooks/use-queries';
import { useActivityTracker } from '@/lib/hooks/use-activity-tracker';
import { WebSocketDisconnectAlert } from '@/components/realtime/WebSocketDisconnectAlert';
import type { components } from '@/lib/api/api';

type Post = components['schemas']['Post'];
type PostId = components['schemas']['PostId'];
type ReactionCounts = components['schemas']['ReactionCounts'];
type ServerInfo = components['schemas']['ServerInfo'];
type ServerConfig = components['schemas']['ServerConfig'];

type RealtimeEvent =
	| { type: 'post_created'; post: Post }
	| { type: 'post_deleted'; postId: PostId }
	| { type: 'reaction_updated'; reactionCounts: ReactionCounts }
	| { type: 'user_registered' }
	| { type: 'user_deleted' }
	| { type: 'server_info_updated'; serverInfo: ServerInfo }
	| { type: 'server_config_updated'; serverConfig: ServerConfig };

interface RealtimeProviderProps {
	children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
	const queryClient = useQueryClient();
	const isAuthenticated = useAtomValue(isAuthenticatedAtom);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const inactivityDisconnectRef = useRef(false);
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
		// Decrement postCount locally
		queryClient.setQueryData(queryKeys.serverInfo, (old: ServerInfo | undefined) => {
			if (!old) return old;
			return { ...old, stats: { ...old.stats, postCount: Math.max(0, old.stats.postCount - 1) } };
		});
	}, [queryClient, removePostFromCache, removePostFromList]);

	const handleReactionUpdated = useCallback((counts: ReactionCounts) => {
		const adjustedReactionCounts: ReactionCounts = {
			...counts,
			reactions: counts.reactions.map((reaction) => ({
				...reaction,
				reactedByCurrentUser: false,
			})),
		};
		queryClient.setQueryData(queryKeys.reactions(counts.postId), adjustedReactionCounts);
		queryClient.setQueryData(['posts', counts.postId, 'reactions'], adjustedReactionCounts.reactions);
	}, [queryClient]);

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

					case 'server_info_updated':
						handleServerInfoUpdated(data.serverInfo);
						break;

					case 'server_config_updated':
						handleServerConfigUpdated(data.serverConfig);
						break;
				}
			} catch (err) {
				console.error('Failed to parse WebSocket message:', err);
			}
		},
		[handlePostCreated, handlePostDeleted, handleReactionUpdated, handleUserRegistered, handleUserDeleted, handleServerInfoUpdated, handleServerConfigUpdated]
	);

	const connect = useCallback(() => {
		if (typeof window === 'undefined') return;

		// Construct WebSocket URL (proxied via Next.js rewrites)
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws/events`;

		try {
			// Note: WebSocket automatically sends cookies (including httpOnly cookies)
			// for same-origin connections, providing cookie-based authentication
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				reconnectAttemptsRef.current = 0;
				// Re-sync server info and config on connect/reconnect to recover missed events
				queryClient.invalidateQueries({ queryKey: queryKeys.serverInfo });
				queryClient.invalidateQueries({ queryKey: queryKeys.serverConfig });
			};

			ws.onmessage = handleMessage;


			ws.onerror = (err) => {
				// Errors are handled in onclose
			};

			ws.onclose = (event) => {
				wsRef.current = null;

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
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (wsRef.current) {
				wsRef.current.close();
			}
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
