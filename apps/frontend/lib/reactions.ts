import type { components } from "@/lib/api/api";

export type ReactionCount = components["schemas"]["ReactionCount"];
export type ReactionCounts = components["schemas"]["ReactionCounts"];

/** A post payload carrying reactions, wherever it sits inside a cached response. */
type PostLike = { id: string; reactions: ReactionCount[] };

function isPostLike(value: unknown, postId: string): value is PostLike {
  if (!value || typeof value !== "object") return false;
  const node = value as { id?: unknown; reactions?: unknown };
  return node.id === postId && Array.isArray(node.reactions);
}

/**
 * The server's `reactedByCurrentUser` is viewer-scoped and authoritative, except
 * on the `reaction_updated` broadcast, which is anonymized for everyone. Pass
 * `trustServerStatus: false` for that case and the post keeps the ownership it
 * already had.
 */
export function mergeReactionStatusForCurrentUser(
  incoming: readonly ReactionCount[],
  current: readonly ReactionCount[],
  options: { trustServerStatus?: boolean } = {},
): ReactionCount[] {
  if (options.trustServerStatus ?? true) {
    return [...incoming];
  }
  const selfEmojis = new Set(
    current.filter((reaction) => reaction.reactedByCurrentUser).map((reaction) => reaction.emoji),
  );
  return incoming.map((reaction) => ({
    ...reaction,
    reactedByCurrentUser: selfEmojis.has(reaction.emoji),
  }));
}

/**
 * Replaces the reactions of one post everywhere it appears inside a cached
 * query payload, whatever shape that payload has: an infinite timeline
 * (`{pages:[{items}]}`), a flat list (`{items}`), a bare post, a post context
 * (`{post,parent,root}`), a thread slice (`{root,anchor,nodes,children}`) or a
 * notification holding a post. Returns the same reference when nothing matched,
 * so React Query keeps structural sharing.
 *
 * ponytail: walks the whole payload rather than branching per response shape —
 * a forgotten shape is exactly how self-reaction state went stale before. If a
 * deep cache ever makes this measurable, narrow the query filter, not the walk.
 */
export function applyReactionCountsToPosts<T>(
  data: T,
  counts: ReactionCounts,
  options: { trustServerStatus?: boolean } = {},
): T {
  if (isPostLike(data, counts.postId)) {
    return {
      ...data,
      reactions: mergeReactionStatusForCurrentUser(counts.reactions, data.reactions, options),
    } as T;
  }
  if (Array.isArray(data)) {
    let changed = false;
    const next = data.map((item) => {
      const patched = applyReactionCountsToPosts(item, counts, options);
      if (patched !== item) changed = true;
      return patched;
    });
    return changed ? (next as unknown as T) : data;
  }
  if (data && typeof data === "object") {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const patched = applyReactionCountsToPosts(value, counts, options);
      if (patched !== value) changed = true;
      next[key] = patched;
    }
    return changed ? (next as T) : data;
  }
  return data;
}

/**
 * Applies one viewer's own toggle to a reaction list: the flag flips and the
 * count moves with it, so a first-ever reaction shows up without waiting for
 * the response.
 */
export function toggleOwnReaction(reactions: readonly ReactionCount[], emoji: string) {
  const existing = reactions.find((reaction) => reaction.emoji === emoji);
  if (!existing) {
    return [...reactions, { emoji, count: 1, reactedByCurrentUser: true }];
  }
  if (!existing.reactedByCurrentUser) {
    return reactions.map((reaction) =>
      reaction.emoji === emoji
        ? { ...reaction, count: reaction.count + 1, reactedByCurrentUser: true }
        : reaction,
    );
  }
  if (existing.count <= 1) {
    return reactions.filter((reaction) => reaction.emoji !== emoji);
  }
  return reactions.map((reaction) =>
    reaction.emoji === emoji
      ? { ...reaction, count: reaction.count - 1, reactedByCurrentUser: false }
      : reaction,
  );
}

/**
 * Updater for `setQueriesData` across the whole cache. Returning `undefined`
 * tells React Query to skip the write, so a query that holds nothing about this
 * post is left alone instead of having its staleness clock reset by every
 * passing reaction.
 */
export function reactionCountsUpdater(
  counts: ReactionCounts,
  options: { trustServerStatus?: boolean } = {},
) {
  return <T>(data: T): T | undefined => {
    const next = applyReactionCountsToPosts(data, counts, options);
    return next === data ? undefined : next;
  };
}
