import { describe, expect, it } from "vitest";
import {
  isReactionByCurrentUser,
  mergeReactionCountsForCurrentUser,
  mergeReactionStatusForCurrentUser,
  reactedEmojiList,
  reactionSelfQueryKey,
  type ReactionCount,
} from "@/lib/reactions";

const reactions: ReactionCount[] = [
  { emoji: "👍", count: 2, reactedByCurrentUser: false },
  { emoji: "🎉", count: 1, reactedByCurrentUser: true },
];

describe("reaction ownership helpers", () => {
  it("uses either local self state or trusted server state for the current user", () => {
    expect(
      isReactionByCurrentUser(reactions[0], new Set(["👍"]), true),
    ).toBe(true);
    expect(
      isReactionByCurrentUser(reactions[1], new Set<string>(), true),
    ).toBe(true);
  });

  it("never marks reactions as current-user reactions for anonymous viewers", () => {
    expect(
      isReactionByCurrentUser(reactions[1], new Set(["🎉"]), false),
    ).toBe(false);
  });

  it("can ignore broadcast server flags while preserving known local self reactions", () => {
    const merged = mergeReactionStatusForCurrentUser(reactions, ["👍"], {
      trustServerStatus: false,
    });

    expect(merged).toEqual([
      { emoji: "👍", count: 2, reactedByCurrentUser: true },
      { emoji: "🎉", count: 1, reactedByCurrentUser: false },
    ]);
  });

  it("merges reaction count payloads without dropping local self reactions", () => {
    const merged = mergeReactionCountsForCurrentUser(
      { postId: "post-1", reactions },
      ["👍"],
      { trustServerStatus: false },
    );

    expect(merged.reactions[0].reactedByCurrentUser).toBe(true);
    expect(merged.reactions[1].reactedByCurrentUser).toBe(false);
  });

  it("extracts reacted emojis and scopes self query keys by user", () => {
    expect(reactedEmojiList(reactions)).toEqual(["🎉"]);
    expect(reactionSelfQueryKey("post-1", "user-1")).toEqual([
      "reactionSelf",
      "post-1",
      "user-1",
    ]);
  });
});
