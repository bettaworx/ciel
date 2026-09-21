import { describe, expect, it } from "vitest";
import {
  applyReactionCountsToPosts,
  mergeReactionStatusForCurrentUser,
  reactionCountsUpdater,
  toggleOwnReaction,
  type ReactionCount,
} from "@/lib/reactions";

const mine: ReactionCount[] = [
  { emoji: "👍", count: 2, reactedByCurrentUser: true },
  { emoji: "🎉", count: 1, reactedByCurrentUser: false },
];

/** The broadcast shape: counts moved on, ownership stripped for everyone. */
const broadcast = {
  postId: "post-1",
  reactions: [
    { emoji: "👍", count: 3, reactedByCurrentUser: false },
    { emoji: "🎉", count: 1, reactedByCurrentUser: false },
  ],
};

const post = (id: string, reactions: ReactionCount[]) => ({ id, reactions, content: "x" });

describe("mergeReactionStatusForCurrentUser", () => {
  it("keeps the viewer's own reactions when the payload cannot be trusted for them", () => {
    const merged = mergeReactionStatusForCurrentUser(broadcast.reactions, mine, {
      trustServerStatus: false,
    });

    expect(merged).toEqual([
      { emoji: "👍", count: 3, reactedByCurrentUser: true },
      { emoji: "🎉", count: 1, reactedByCurrentUser: false },
    ]);
  });

  it("takes the payload as-is by default", () => {
    expect(mergeReactionStatusForCurrentUser(broadcast.reactions, mine)).toEqual(
      broadcast.reactions,
    );
  });
});

describe("applyReactionCountsToPosts", () => {
  const cases: Array<[string, unknown]> = [
    ["infinite timeline", { pages: [{ items: [post("post-0", []), post("post-1", mine)] }] }],
    ["flat list", { items: [post("post-1", mine)] }],
    ["bare post", post("post-1", mine)],
    ["post context", { post: post("post-1", mine), parent: null, root: post("post-0", []) }],
    [
      "thread slice",
      { root: post("post-0", []), anchor: post("post-1", mine), nodes: [post("post-1", mine)] },
    ],
    ["notification", { items: [{ id: "n1", type: "reaction", post: post("post-1", mine) }] }],
  ];

  for (const [name, data] of cases) {
    it(`patches the post inside a ${name} payload`, () => {
      const next = applyReactionCountsToPosts(data, broadcast, { trustServerStatus: false });

      expect(next).not.toBe(data);
      const patched = JSON.stringify(next);
      expect(patched).toContain('"count":3');
      // Regression: an anonymized broadcast must not drop the viewer's own reaction.
      expect(patched).toContain('"emoji":"👍","count":3,"reactedByCurrentUser":true');
      expect(patched).not.toContain('"emoji":"👍","count":2');
    });
  }

  it("leaves other posts alone", () => {
    const data = { items: [post("post-0", mine), post("post-1", mine)] };
    const next = applyReactionCountsToPosts(data, broadcast, { trustServerStatus: false });

    expect(next.items[0]).toBe(data.items[0]);
    expect(next.items[1]).not.toBe(data.items[1]);
  });

  it("returns the same reference when the post is not in the payload", () => {
    const data = { items: [post("post-2", mine)] };
    expect(applyReactionCountsToPosts(data, broadcast)).toBe(data);
  });
});

describe("toggleOwnReaction", () => {
  it("adds an emoji nobody used yet", () => {
    expect(toggleOwnReaction(mine, "🔥")).toEqual([
      ...mine,
      { emoji: "🔥", count: 1, reactedByCurrentUser: true },
    ]);
  });

  it("joins an existing reaction", () => {
    expect(toggleOwnReaction(mine, "🎉")[1]).toEqual({
      emoji: "🎉",
      count: 2,
      reactedByCurrentUser: true,
    });
  });

  it("leaves an existing reaction", () => {
    expect(toggleOwnReaction(mine, "👍")[0]).toEqual({
      emoji: "👍",
      count: 1,
      reactedByCurrentUser: false,
    });
  });

  it("drops the reaction entirely when it was the only one", () => {
    const solo: ReactionCount[] = [{ emoji: "👍", count: 1, reactedByCurrentUser: true }];
    expect(toggleOwnReaction(solo, "👍")).toEqual([]);
  });
});

describe("reactionCountsUpdater", () => {
  it("skips the write for queries that hold nothing about the post", () => {
    const update = reactionCountsUpdater(broadcast);

    expect(update({ items: [post("post-2", mine)] })).toBeUndefined();
    expect(update(undefined)).toBeUndefined();
    expect(update({ items: [post("post-1", mine)] })).toBeDefined();
  });
});
