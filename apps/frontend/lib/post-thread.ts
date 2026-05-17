import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type TimelinePage = components["schemas"]["TimelinePage"];

export type FetchRepliesPage = (
  postId: string,
  params: { limit: number; cursor?: string | null },
) => Promise<TimelinePage>;

const OWNER_REPLY_THREAD_PAGE_LIMIT = 100;
const OWNER_REPLY_THREAD_CHUNK_DEPTH = 3;

export type OwnerReplyThreadChunk = {
  replies: Post[];
  continuationParentIds: string[];
};

export type CollectOwnerReplyThreadChunkOptions = {
  depthLimit?: number;
  visitedPostIds?: Iterable<string>;
};

export async function collectOwnerReplyThread(
  rootPost: Post,
  fetchRepliesPage: FetchRepliesPage,
): Promise<Post[]> {
  const result = await collectOwnerReplyThreadChunk(rootPost, fetchRepliesPage, {
    depthLimit: Number.MAX_SAFE_INTEGER,
  });
  return result.replies;
}

export async function collectOwnerReplyThreadChunk(
  rootPost: Post,
  fetchRepliesPage: FetchRepliesPage,
  options: CollectOwnerReplyThreadChunkOptions = {},
): Promise<OwnerReplyThreadChunk> {
  const ownerId = rootPost.author?.id;
  if (!ownerId) {
    return { replies: [], continuationParentIds: [] };
  }

  const depthLimit = Math.max(
    1,
    Math.floor(options.depthLimit ?? OWNER_REPLY_THREAD_CHUNK_DEPTH),
  );
  const visitedPostIds = new Set<string>(options.visitedPostIds ?? []);
  visitedPostIds.add(rootPost.id);
  const collected: Post[] = [];
  const continuationParentIds = new Set<string>();

  async function fetchAllDirectReplies(parentId: string): Promise<Post[]> {
    const replies: Post[] = [];
    let cursor: string | null | undefined = null;

    do {
      const page = await fetchRepliesPage(parentId, {
        limit: OWNER_REPLY_THREAD_PAGE_LIMIT,
        cursor,
      });
      replies.push(...(page.items ?? []));
      cursor = page.nextCursor ?? null;
    } while (cursor);

    return replies;
  }

  async function hasUnvisitedOwnerReply(parentId: string): Promise<boolean> {
    const replies = await fetchAllDirectReplies(parentId);
    return replies.some(
      (reply) => !visitedPostIds.has(reply.id) && reply.author?.id === ownerId,
    );
  }

  async function visitOwnerReplies(
    parentId: string,
    depth: number,
  ): Promise<void> {
    const replies = await fetchAllDirectReplies(parentId);

    for (const reply of replies) {
      if (visitedPostIds.has(reply.id)) {
        continue;
      }
      visitedPostIds.add(reply.id);

      if (reply.author?.id !== ownerId) {
        continue;
      }

      collected.push(reply);
      if (depth >= depthLimit) {
        if (
          reply.replyCount > 0 &&
          (await hasUnvisitedOwnerReply(reply.id))
        ) {
          continuationParentIds.add(reply.id);
        }
        continue;
      }

      await visitOwnerReplies(reply.id, depth + 1);
    }
  }

  await visitOwnerReplies(rootPost.id, 1);
  return {
    replies: collected,
    continuationParentIds: Array.from(continuationParentIds),
  };
}

export function groupOwnerReplyThreads(
  rootPostId: string,
  replies: Post[],
): Post[][] {
  const replyIds = new Set(replies.map((reply) => reply.id));
  const childrenByParent = new Map<string, Post[]>();

  for (const reply of replies) {
    const parentId = reply.parentId ?? rootPostId;
    const groupParentId =
      parentId === rootPostId || replyIds.has(parentId)
        ? parentId
        : rootPostId;
    const children = childrenByParent.get(groupParentId) ?? [];
    children.push(reply);
    childrenByParent.set(groupParentId, children);
  }

  for (const children of childrenByParent.values()) {
    children.sort(comparePostsOldestFirst);
  }

  const visited = new Set<string>();

  function flattenFrom(post: Post): Post[] {
    if (visited.has(post.id)) return [];
    visited.add(post.id);

    const descendants = childrenByParent
      .get(post.id)
      ?.flatMap((child) => flattenFrom(child));

    return [post, ...(descendants ?? [])];
  }

  return (childrenByParent.get(rootPostId) ?? [])
    .slice()
    .sort(comparePostsOldestFirst)
    .map((threadRoot) => flattenFrom(threadRoot))
    .filter((thread) => thread.length > 0);
}

function comparePostsOldestFirst(a: Post, b: Post): number {
  const diff = Date.parse(a.createdAt) - Date.parse(b.createdAt);
  if (diff !== 0) return diff;
  return a.id.localeCompare(b.id);
}
