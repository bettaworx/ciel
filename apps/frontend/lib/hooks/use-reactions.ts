"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useApi } from "@/lib/api/use-api";
import {
  reactionCountsUpdater,
  toggleOwnReaction,
  type ReactionCount,
  type ReactionCounts,
} from "@/lib/reactions";

export interface Reaction {
  emoji: string;
  count: number;
  isReacted: boolean;
}

/**
 * Reactions are read straight from the post payload the caller already has:
 * `reactedByCurrentUser` is viewer-scoped server state, and a second cache of it
 * only gives the two copies a chance to disagree. Toggling patches every cached
 * post instead, so the same post updates in the timeline, the thread and the
 * detail view at once.
 */
export function useReactions(postId: string, reactions: readonly ReactionCount[]) {
  const api = useApi();
  const queryClient = useQueryClient();
  const auth = useAtomValue(authAtom);
  const isAuthenticated = auth.status === "ready" && auth.user !== null;

  const applyToCaches = (next: readonly ReactionCount[]) => {
    queryClient.setQueriesData({}, reactionCountsUpdater({ postId, reactions: [...next] }));
  };

  // Most reactions first.
  const displayed: Reaction[] = reactions
    .map((reaction) => ({
      emoji: reaction.emoji,
      count: reaction.count,
      isReacted: isAuthenticated && reaction.reactedByCurrentUser,
    }))
    .sort((a, b) => b.count - a.count);

  const { mutate: toggleReaction, isPending } = useMutation({
    mutationFn: async (emoji: string) => {
      if (!isAuthenticated) {
        throw new Error("loginRequired");
      }
      const isCurrentlyReacted =
        reactions.find((reaction) => reaction.emoji === emoji)?.reactedByCurrentUser ?? false;

      const result = isCurrentlyReacted
        ? await api.removeReaction(postId, emoji) // Cookie-based auth
        : await api.addReaction(postId, { emoji }); // Cookie-based auth
      if (!result.ok) {
        throw new Error(
          result.errorText ||
            (isCurrentlyReacted ? "Failed to remove reaction" : "Failed to add reaction"),
        );
      }
      return result.data as ReactionCounts | undefined;
    },
    onMutate: (emoji) => {
      const previous = [...reactions];
      applyToCaches(toggleOwnReaction(reactions, emoji));
      return { previous };
    },
    onError: (_error, _emoji, context) => {
      if (context?.previous) {
        applyToCaches(context.previous);
      }
    },
    onSuccess: (counts, emoji) => {
      if (counts?.reactions) {
        applyToCaches(counts.reactions);
      }
      // The hover card lists who reacted, so it has to lose this viewer too.
      queryClient.invalidateQueries({ queryKey: ["reaction-users", postId, emoji] });
    },
  });

  return {
    reactions: displayed,
    toggleReaction,
    isPending,
  };
}
