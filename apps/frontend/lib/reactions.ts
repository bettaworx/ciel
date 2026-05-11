import type { components } from "@/lib/api/api";

export type ReactionCount = components["schemas"]["ReactionCount"];
export type ReactionCounts = components["schemas"]["ReactionCounts"];

export function reactionSelfQueryKey(postId: string, userId?: string | null) {
  return ["reactionSelf", postId, userId ?? "anonymous"] as const;
}

export function isReactionByCurrentUser(
  reaction: Pick<ReactionCount, "emoji" | "reactedByCurrentUser">,
  selfEmojiSet: ReadonlySet<string>,
  isAuthenticated: boolean,
) {
  return (
    isAuthenticated &&
    (selfEmojiSet.has(reaction.emoji) || reaction.reactedByCurrentUser)
  );
}

export function reactedEmojiList(reactions: readonly ReactionCount[] | undefined) {
  return (reactions ?? [])
    .filter((reaction) => reaction.reactedByCurrentUser)
    .map((reaction) => reaction.emoji);
}

export function mergeReactionStatusForCurrentUser(
  reactions: readonly ReactionCount[],
  selfEmojis: readonly string[] | undefined,
  options: { trustServerStatus?: boolean } = {},
) {
  const { trustServerStatus = true } = options;
  const selfEmojiSet = new Set(selfEmojis ?? []);

  return reactions.map((reaction) => ({
    ...reaction,
    reactedByCurrentUser:
      selfEmojiSet.has(reaction.emoji) ||
      (trustServerStatus && reaction.reactedByCurrentUser),
  }));
}

export function mergeReactionCountsForCurrentUser(
  counts: ReactionCounts,
  selfEmojis: readonly string[] | undefined,
  options: { trustServerStatus?: boolean } = {},
): ReactionCounts {
  return {
    ...counts,
    reactions: mergeReactionStatusForCurrentUser(
      counts.reactions,
      selfEmojis,
      options,
    ),
  };
}
