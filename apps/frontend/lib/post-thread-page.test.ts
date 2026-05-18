import { describe, expect, it } from "vitest";

import {
  buildThreadRows,
  mergeThreadPages,
  removePostFromThreadPage,
} from "@/lib/post-thread-page";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type ThreadPage = components["schemas"]["ThreadPage"];

const author = { id: "user-id", username: "user" };
const otherAuthor = { id: "other-id", username: "other" };

function post(id: string, overrides: Partial<Post> = {}): Post {
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

function page(
  nodes: Post[],
  children: ThreadPage["children"],
  root = nodes[0],
  anchor = root,
): ThreadPage {
  return {
    root,
    anchor,
    nodes,
    children,
  };
}

describe("buildThreadRows", () => {
  it("flattens known thread children depth-first without including the root", () => {
    const root = post("root");
    const replyA = post("reply-a", { parentId: root.id });
    const replyB = post("reply-b", { parentId: root.id });
    const nested = post("nested", { parentId: replyA.id });

    const rows = buildThreadRows(
      page(
        [root, replyA, replyB, nested],
        [
          {
            parentId: root.id,
            childIds: [replyA.id, replyB.id],
            nextCursor: null,
            hasMore: false,
          },
          {
            parentId: replyA.id,
            childIds: [nested.id],
            nextCursor: null,
            hasMore: false,
          },
        ],
      ),
    );

    expect(rows.map((row) => [row.post.id, row.parentId, row.depth])).toEqual([
      ["reply-a", root.id, 1],
      ["nested", replyA.id, 2],
      ["reply-b", root.id, 1],
    ]);
  });

  it("marks a row expandable when the API stopped before loading children", () => {
    const root = post("root");
    const reply = post("reply", { parentId: root.id, replyCount: 2 });

    const rows = buildThreadRows(
      page([root, reply], [
        {
          parentId: root.id,
          childIds: [reply.id],
          nextCursor: null,
          hasMore: false,
        },
      ]),
    );

    expect(rows[0]?.canLoadChildren).toBe(true);
  });

  it("continues a nested thread only through the oldest same-author reply", () => {
    const root = post("root");
    const reply = post("reply", {
      parentId: root.id,
      replyCount: 3,
    });
    const otherReply = post("other-reply", {
      parentId: reply.id,
      author: {
        displayName: null,
        bio: null,
        avatarUrl: null,
        bannerUrl: null,
        createdAt: "2026-05-17T00:00:00.000Z",
        ...otherAuthor,
      },
    });
    const oldestContinuation = post("oldest-continuation", {
      parentId: reply.id,
    });
    const newerContinuation = post("newer-continuation", {
      parentId: reply.id,
    });

    const rows = buildThreadRows(
      page(
        [root, reply, otherReply, oldestContinuation, newerContinuation],
        [
          {
            parentId: root.id,
            childIds: [reply.id],
            nextCursor: null,
            hasMore: false,
          },
          {
            parentId: reply.id,
            childIds: [
              otherReply.id,
              oldestContinuation.id,
              newerContinuation.id,
            ],
            nextCursor: null,
            hasMore: false,
          },
        ],
      ),
    );

    expect(rows.map((row) => row.post.id)).toEqual([
      reply.id,
      oldestContinuation.id,
    ]);
    expect(rows[0]?.canLoadChildren).toBe(false);
  });
});

describe("mergeThreadPages", () => {
  it("appends direct children from a continuation page without duplicating nodes", () => {
    const root = post("root");
    const first = post("first", { parentId: root.id });
    const second = post("second", { parentId: root.id });

    const current = page(
      [root, first],
      [
        {
          parentId: root.id,
          childIds: [first.id],
          nextCursor: "cursor-1",
          hasMore: true,
        },
      ],
    );
    const incoming = page(
      [root, second],
      [
        {
          parentId: root.id,
          childIds: [second.id],
          nextCursor: null,
          hasMore: false,
        },
      ],
    );

    const merged = mergeThreadPages(current, incoming);

    expect(merged.nodes.map((node) => node.id)).toEqual([
      "root",
      "first",
      "second",
    ]);
    expect(merged.children[0]).toEqual({
      parentId: root.id,
      childIds: [first.id, second.id],
      nextCursor: null,
      hasMore: false,
    });
  });
});

describe("removePostFromThreadPage", () => {
  it("removes a deleted branch and decrements the direct parent's reply count", () => {
    const root = post("root", { replyCount: 2 });
    const replyA = post("reply-a", {
      parentId: root.id,
      replyCount: 1,
    });
    const replyB = post("reply-b", { parentId: root.id });
    const nested = post("nested", { parentId: replyA.id });

    const next = removePostFromThreadPage(
      page(
        [root, replyA, replyB, nested],
        [
          {
            parentId: root.id,
            childIds: [replyA.id, replyB.id],
            nextCursor: null,
            hasMore: false,
          },
          {
            parentId: replyA.id,
            childIds: [nested.id],
            nextCursor: null,
            hasMore: false,
          },
        ],
      ),
      replyA.id,
    );

    expect(next.nodes.map((node) => node.id)).toEqual(["root", "reply-b"]);
    expect(next.root.replyCount).toBe(1);
    expect(next.children).toEqual([
      {
        parentId: root.id,
        childIds: [replyB.id],
        nextCursor: null,
        hasMore: false,
      },
    ]);
  });
});
