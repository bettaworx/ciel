import { describe, expect, it } from "vitest";

import {
  collectOwnerReplyThread,
  collectOwnerReplyThreadChunk,
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

describe("collectOwnerReplyThreadChunk", () => {
  it("collects only three nested owner replies per branch", async () => {
    const root = post("root", owner, { replyCount: 1 });
    const ownerA = post("owner-a", owner, {
      parentId: root.id,
      replyCount: 1,
    });
    const ownerB = post("owner-b", owner, {
      parentId: ownerA.id,
      replyCount: 1,
    });
    const ownerC = post("owner-c", owner, {
      parentId: ownerB.id,
      replyCount: 1,
    });
    const ownerD = post("owner-d", owner, {
      parentId: ownerC.id,
    });

    const chunk = await collectOwnerReplyThreadChunk(
      root,
      makeFetchReplies({
        [root.id]: [page([ownerA])],
        [ownerA.id]: [page([ownerB])],
        [ownerB.id]: [page([ownerC])],
        [ownerC.id]: [page([ownerD])],
      }),
    );

    expect(chunk.replies.map((reply) => reply.id)).toEqual([
      "owner-a",
      "owner-b",
      "owner-c",
    ]);
    expect(chunk.continuationParentIds).toEqual(["owner-c"]);
  });

  it("loads the next three nested owner replies from a continuation parent", async () => {
    const root = post("root", owner, { replyCount: 1 });
    const ownerA = post("owner-a", owner, {
      parentId: root.id,
      replyCount: 1,
    });
    const ownerB = post("owner-b", owner, {
      parentId: ownerA.id,
      replyCount: 1,
    });
    const ownerC = post("owner-c", owner, {
      parentId: ownerB.id,
      replyCount: 1,
    });
    const ownerD = post("owner-d", owner, {
      parentId: ownerC.id,
      replyCount: 1,
    });
    const ownerE = post("owner-e", owner, {
      parentId: ownerD.id,
      replyCount: 1,
    });
    const ownerF = post("owner-f", owner, {
      parentId: ownerE.id,
      replyCount: 1,
    });
    const ownerG = post("owner-g", owner, {
      parentId: ownerF.id,
    });

    const chunk = await collectOwnerReplyThreadChunk(
      ownerC,
      makeFetchReplies({
        [ownerC.id]: [page([ownerD])],
        [ownerD.id]: [page([ownerE])],
        [ownerE.id]: [page([ownerF])],
        [ownerF.id]: [page([ownerG])],
      }),
      {
        visitedPostIds: [root.id, ownerA.id, ownerB.id, ownerC.id],
      },
    );

    expect(chunk.replies.map((reply) => reply.id)).toEqual([
      "owner-d",
      "owner-e",
      "owner-f",
    ]);
    expect(chunk.continuationParentIds).toEqual(["owner-f"]);
  });

  it("does not expose a continuation when deeper replies are not owner-authored", async () => {
    const root = post("root", owner, { replyCount: 1 });
    const ownerA = post("owner-a", owner, {
      parentId: root.id,
      replyCount: 1,
    });
    const ownerB = post("owner-b", owner, {
      parentId: ownerA.id,
      replyCount: 1,
    });
    const ownerC = post("owner-c", owner, {
      parentId: ownerB.id,
      replyCount: 1,
    });
    const otherD = post("other-d", other, {
      parentId: ownerC.id,
    });

    const chunk = await collectOwnerReplyThreadChunk(
      root,
      makeFetchReplies({
        [root.id]: [page([ownerA])],
        [ownerA.id]: [page([ownerB])],
        [ownerB.id]: [page([ownerC])],
        [ownerC.id]: [page([otherD])],
      }),
    );

    expect(chunk.replies.map((reply) => reply.id)).toEqual([
      "owner-a",
      "owner-b",
      "owner-c",
    ]);
    expect(chunk.continuationParentIds).toEqual([]);
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
