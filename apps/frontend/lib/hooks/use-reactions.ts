'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/atoms/auth';
import { useApi } from '@/lib/api/use-api';
import { queryKeys } from '@/lib/hooks/use-queries';
import type { components } from '@/lib/api/api';

type ReactionCount = components['schemas']['ReactionCount'];
type ReactionCounts = components['schemas']['ReactionCounts'];

export interface Reaction {
	emoji: string;
	count: number;
	isReacted: boolean;
}

export function useReactions(postId: string) {
	const api = useApi();
	const queryClient = useQueryClient();
	const isAuthenticated = useAtomValue(isAuthenticatedAtom);
	const reactionSelfKey = ['reactionSelf', postId] as const;
	const initializedRef = useRef(false);
	const { data: selfEmojis } = useQuery<string[]>({
		queryKey: reactionSelfKey,
		queryFn: async () => [],
		initialData: [],
		enabled: false,
	});

	// Fetch reactions for the post
	const { data: reactionsData } = useQuery<ReactionCount[]>({
		queryKey: ['posts', postId, 'reactions'],
		queryFn: async () => {
			const result = await api.reactionCounts(postId);
			if (!result.ok) {
				throw new Error(result.errorText || 'Failed to fetch reactions');
			}
			// API returns ReactionCounts with a reactions array
			return result.data?.reactions || [];
		},
	});

	useEffect(() => {
		if (!isAuthenticated) {
			queryClient.setQueryData(reactionSelfKey, [] as string[]);
			initializedRef.current = false;
			return;
		}
		if (!reactionsData) {
			return;
		}
		if (initializedRef.current) {
			return;
		}
		const nextSelfEmojis = reactionsData
			.filter((reaction) => reaction.reactedByCurrentUser)
			.map((reaction) => reaction.emoji);
		queryClient.setQueryData(reactionSelfKey, nextSelfEmojis);
		initializedRef.current = true;
	}, [isAuthenticated, queryClient, reactionSelfKey, reactionsData]);

	useEffect(() => {
		initializedRef.current = false;
	}, [postId]);

	const selfEmojiSet = new Set(selfEmojis ?? []);

	// Convert API ReactionCount to our Reaction interface
	// Sort by count in descending order (most reactions first)
	const reactions: Reaction[] = (reactionsData || [])
		.map((reaction) => ({
			emoji: reaction.emoji,
			count: reaction.count,
			isReacted: isAuthenticated ? selfEmojiSet.has(reaction.emoji) : false,
		}))
		.sort((a, b) => b.count - a.count);

	// Toggle reaction mutation
	const { mutate: toggleReaction, isPending } = useMutation({
		mutationFn: async (emoji: string) => {
			// Check authentication first
			if (!isAuthenticated) {
				throw new Error('loginRequired');
			}

			// Check if user has already reacted with this emoji
			const reaction = reactions.find((r) => r.emoji === emoji);
			const isCurrentlyReacted = reaction?.isReacted || false;

			if (isCurrentlyReacted) {
				// Remove reaction (DELETE)
				const result = await api.removeReaction(postId, emoji); // Cookie-based auth
				if (!result.ok) {
					throw new Error(result.errorText || 'Failed to remove reaction');
				}
				return result.data as ReactionCounts | undefined;
			} else {
				// Add reaction (POST)
				const result = await api.addReaction(postId, { emoji }); // Cookie-based auth
				if (!result.ok) {
					throw new Error(result.errorText || 'Failed to add reaction');
				}
				return result.data as ReactionCounts | undefined;
			}
		},
		onMutate: (emoji) => {
			const previousSelf = queryClient.getQueryData<string[]>(reactionSelfKey);
			queryClient.setQueryData<string[]>(reactionSelfKey, (current) => {
				const set = new Set(current ?? []);
				if (set.has(emoji)) {
					set.delete(emoji);
				} else {
					set.add(emoji);
				}
				return Array.from(set);
			});
			queryClient.setQueryData<ReactionCount[]>(['posts', postId, 'reactions'], (previous) => {
				if (!previous) {
					return previous;
				}
				let changed = false;
				const next = previous.map((reaction) => {
					if (reaction.emoji !== emoji) {
						return reaction;
					}
					changed = true;
					return {
						...reaction,
						reactedByCurrentUser: !reaction.reactedByCurrentUser,
					};
				});
				return changed ? next : previous;
			});
			return { previousSelf };
		},
		onError: (_error, _emoji, context) => {
			if (context?.previousSelf) {
				queryClient.setQueryData(reactionSelfKey, context.previousSelf);
			}
		},
		onSuccess: (counts) => {
			if (counts?.reactions) {
				const nextSelfEmojis = counts.reactions
					.filter((reaction) => reaction.reactedByCurrentUser)
					.map((reaction) => reaction.emoji);
				queryClient.setQueryData(reactionSelfKey, nextSelfEmojis);
			}
			// Invalidate and refetch reactions for this post
			queryClient.invalidateQueries({ queryKey: ['posts', postId, 'reactions'] });
			queryClient.invalidateQueries({ queryKey: queryKeys.reactions(postId) });
		// Also invalidate the post itself in case it's cached
		queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
		},
	});

	return {
		reactions,
		toggleReaction,
		isPending,
	};
}
