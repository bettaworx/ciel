"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useApi } from "@/lib/api/use-api";
import { queryKeys } from "@/lib/hooks/use-queries";
import {
  getTimelineOwnerThreadMergeRootIds,
  mergeTimelineOwnerThreads,
} from "@/lib/post-thread";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];

export function useOwnerThreadTimelineItems(posts: Post[]) {
  const api = useApi();
  const mergeRootIds = useMemo(
    () => getTimelineOwnerThreadMergeRootIds(posts),
    [posts],
  );
  const loadedPostIds = useMemo(
    () => new Set(posts.map((post) => post.id)),
    [posts],
  );
  const missingMergeRootIds = useMemo(
    () => mergeRootIds.filter((rootId) => !loadedPostIds.has(rootId)),
    [loadedPostIds, mergeRootIds],
  );
  const mergeRootPostQueries = useQueries({
    queries: missingMergeRootIds.map((rootId) => ({
      queryKey: queryKeys.post(rootId),
      queryFn: async () => {
        const result = await api.getPost(rootId);
        if (!result.ok) throw new Error(result.errorText);
        return result.data;
      },
      staleTime: 1000 * 60,
    })),
  });

  return useMemo(() => {
    const rootPostsById = new Map<string, Post>();
    for (const query of mergeRootPostQueries) {
      if (query.data) {
        rootPostsById.set(query.data.id, query.data);
      }
    }
    return mergeTimelineOwnerThreads(posts, rootPostsById);
  }, [mergeRootPostQueries, posts]);
}
