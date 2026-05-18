import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type ThreadChildren = components["schemas"]["ThreadChildren"];
type ThreadPage = components["schemas"]["ThreadPage"];

export type ThreadRow = {
  post: Post;
  parentId: string;
  depth: number;
  children?: ThreadChildren;
  canLoadChildren: boolean;
};

export function mergeThreadPages(
  current: ThreadPage | null | undefined,
  incoming: ThreadPage,
): ThreadPage {
  if (!current || current.root.id !== incoming.root.id) {
    return incoming;
  }

  const nodeIds = current.nodes.map((node) => node.id);
  const nodesById = new Map(current.nodes.map((node) => [node.id, node]));

  for (const node of incoming.nodes) {
    if (!nodesById.has(node.id)) {
      nodeIds.push(node.id);
    }
    nodesById.set(node.id, node);
  }

  const childrenByParentId = new Map(
    current.children.map((children) => [children.parentId, children]),
  );

  for (const incomingChildren of incoming.children) {
    const existingChildren = childrenByParentId.get(incomingChildren.parentId);
    if (!existingChildren) {
      childrenByParentId.set(incomingChildren.parentId, incomingChildren);
      continue;
    }

    childrenByParentId.set(incomingChildren.parentId, {
      ...incomingChildren,
      childIds: appendUnique(
        existingChildren.childIds,
        incomingChildren.childIds,
      ),
    });
  }

  return {
    root: nodesById.get(incoming.root.id) ?? incoming.root,
    anchor: nodesById.get(current.anchor.id) ?? current.anchor,
    nodes: nodeIds
      .map((id) => nodesById.get(id))
      .filter((node): node is Post => Boolean(node)),
    children: Array.from(childrenByParentId.values()),
  };
}

export function buildThreadRows(
  page: ThreadPage,
  rootId = page.root.id,
): ThreadRow[] {
  const nodesById = new Map(page.nodes.map((node) => [node.id, node]));
  const childrenByParentId = new Map(
    page.children.map((children) => [children.parentId, children]),
  );
  const rows: ThreadRow[] = [];
  const visitedPostIds = new Set<string>([rootId]);

  function getFlowChildIds(parentId: string, children: ThreadChildren): string[] {
    if (parentId === rootId) {
      return children.childIds;
    }

    const parent = nodesById.get(parentId);
    const parentAuthorId = parent?.author?.id;
    if (!parentAuthorId) {
      return [];
    }

    const continuationChildId = children.childIds.find(
      (childId) => nodesById.get(childId)?.author?.id === parentAuthorId,
    );
    return continuationChildId ? [continuationChildId] : [];
  }

  function visit(parentId: string, depth: number) {
    const children = childrenByParentId.get(parentId);
    if (!children) return;

    for (const childId of getFlowChildIds(parentId, children)) {
      if (visitedPostIds.has(childId)) continue;

      const child = nodesById.get(childId);
      if (!child) continue;

      visitedPostIds.add(childId);
      const childChildren = childrenByParentId.get(child.id);
      rows.push({
        post: child,
        parentId,
        depth,
        children: childChildren,
        canLoadChildren:
          Boolean(
            childChildren?.hasMore &&
              getFlowChildIds(child.id, childChildren).length === 0,
          ) ||
          (!childChildren && child.replyCount > 0),
      });

      if (childChildren) {
        visit(child.id, depth + 1);
      }
    }
  }

  visit(rootId, 1);
  return rows;
}

export function removePostFromThreadPage(
  page: ThreadPage,
  postId: string,
): ThreadPage {
  const nodesById = new Map(page.nodes.map((node) => [node.id, node]));
  const deletedPost = nodesById.get(postId);
  if (!deletedPost) {
    return page;
  }

  const childrenByParentId = new Map(
    page.children.map((children) => [children.parentId, children]),
  );
  const removedPostIds = new Set<string>();

  function collectRemovedSubtree(parentId: string) {
    if (removedPostIds.has(parentId)) return;
    removedPostIds.add(parentId);

    const children = childrenByParentId.get(parentId);
    if (!children) return;

    for (const childId of children.childIds) {
      collectRemovedSubtree(childId);
    }
  }

  collectRemovedSubtree(postId);

  const parentId = deletedPost.parentId ?? null;
  const updateRemainingPost = (post: Post): Post => {
    if (post.id !== parentId) return post;
    return {
      ...post,
      replyCount: Math.max(0, post.replyCount - 1),
    };
  };

  const nodes = page.nodes
    .filter((node) => !removedPostIds.has(node.id))
    .map(updateRemainingPost);

  return {
    root: removedPostIds.has(page.root.id)
      ? page.root
      : updateRemainingPost(page.root),
    anchor: removedPostIds.has(page.anchor.id)
      ? updateRemainingPost(page.root)
      : updateRemainingPost(page.anchor),
    nodes,
    children: page.children
      .filter((children) => !removedPostIds.has(children.parentId))
      .map((children) => ({
        ...children,
        childIds: children.childIds.filter(
          (childId) => !removedPostIds.has(childId),
        ),
      })),
  };
}

function appendUnique(current: string[], incoming: string[]): string[] {
  const seenIds = new Set(current);
  const next = current.slice();

  for (const id of incoming) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    next.push(id);
  }

  return next;
}
