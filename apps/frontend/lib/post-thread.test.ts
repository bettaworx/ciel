import { describe, expect, it } from "vitest";

import {
  collectOwnerReplyThread,
  groupOwnerReplyThreads,
  type FetchRepliesPage,
} from "@/lib/post-thread";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type TimelinePage = components["schemas"]["TimelinePage"];

const owner = { id: "owner-id", username: "owner" };
const other = { id: "other-id", username: "other" };

function post(
  id: string,
  author = owner,
  overrides: Partial<Post> = {},
): Post {
  return {
    id,
    author: {
      displayName: null,
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      createdAt: "2026-05-17T00:00:00.000Z",
      ...author,
    },
    content: id,
    media: [],
    reactions: [],
    mentions: [],
    replyCount: 0,
    createdAt: "2026-05-17T00:00:00.000Z",
    ...overrides,
  };
}

function page(items: Post[], nextCursor?: string | null): TimelinePage {
  return {
    items,
    nextCursor: nextCursor ?? null,
  };
}

function makeFetchReplies(
  repliesByParent: Record<string, TimelinePage[]>,
): FetchRepliesPage {
  return async (postId, params) => {
    const pages = repliesByParent[postId] ?? [page([])];
    if (!params.cursor) return pages[0] ?? page([]);
    const pageIndex = Number(params.cursor);
    return pages[pageIndex] ?? page([]);
  };
}

describe("collectOwnerReplyThread", () => {
  it("collects every owner-authored branch and nested owner reply", async () => {
    const root = post("root", owner, { replyCount: 3 });
    const ownerA = post("owner-a", owner, { parentId: root.id, replyCount: 1 });
    const ownerB = post("owner-b", owner, { parentId: root.id });
    const ownerAChild = post("owner-a-child", owner, {
      parentId: ownerA.id,
    });
    const otherReply = post("other-reply", other, {
      parentId: root.id,
      replyCount: 1,
    });
    const ownerUnderOther = post("owner-under-other", owner, {
      parentId: otherReply.id,
    });

    const replies = await collectOwnerReplyThread(
      root,
      makeFetchReplies({
        [root.id]: [page([ownerA, otherReply, ownerB])],
        [ownerA.id]: [page([ownerAChild])],
        [ownerAChild.id]: [page([])],
        [ownerB.id]: [page([])],
        [otherReply.id]: [page([ownerUnderOther])],
      }),
    );

    expect(replies.map((reply) => reply.id)).toEqual([
      "owner-a",
      "owner-a-child",
      "owner-b",
    ]);
  });

  it("walks every replies page before recursing", async () => {
    const root = post("root", owner, { replyCount: 2 });
    const firstPageReply = post("first-page-reply", owner);
    const secondPageReply = post("second-page-reply", owner);

    const replies = await collectOwnerReplyThread(
      root,
      makeFetchReplies({
        [root.id]: [
          page([firstPageReply], "1"),
          page([secondPageReply], null),
        ],
        [firstPageReply.id]: [page([])],
        [secondPageReply.id]: [page([])],
      }),
    );

    expect(replies.map((reply) => reply.id)).toEqual([
      "first-page-reply",
      "second-page-reply",
    ]);
  });

  it("does not collect duplicates when a malformed reply graph repeats a post", async () => {
    const root = post("root", owner, { replyCount: 1 });
    const repeated = post("repeated", owner, { parentId: root.id });

    const replies = await collectOwnerReplyThread(
      root,
      makeFetchReplies({
        [root.id]: [page([repeated, repeated])],
        [repeated.id]: [page([root])],
      }),
    );

    expect(replies.map((reply) => reply.id)).toEqual(["repeated"]);
  });
});

describe("groupOwnerReplyThreads", () => {
  it("groups owner reply chains and sorts multiple threads oldest first", () => {
    const root = post("root");
    const newerThreadRoot = post("newer-thread-root", owner, {
      parentId: root.id,
      createdAt: "2026-05-17T00:10:00.000Z",
    });
    const olderThreadRoot = post("older-thread-root", owner, {
      parentId: root.id,
      createdAt: "2026-05-17T00:05:00.000Z",
    });
    const newerThreadChild = post("newer-thread-child", owner, {
      parentId: newerThreadRoot.id,
      createdAt: "2026-05-17T00:11:00.000Z",
    });
    const olderThreadChild = post("older-thread-child", owner, {
      parentId: olderThreadRoot.id,
      createdAt: "2026-05-17T00:06:00.000Z",
    });

    const threads = groupOwnerReplyThreads(root.id, [
      newerThreadRoot,
      newerThreadChild,
      olderThreadRoot,
      olderThreadChild,
    ]);

    expect(threads.map((thread) => thread.map((reply) => reply.id))).toEqual([
      ["older-thread-root", "older-thread-child"],
      ["newer-thread-root", "newer-thread-child"],
    ]);
  });
});
