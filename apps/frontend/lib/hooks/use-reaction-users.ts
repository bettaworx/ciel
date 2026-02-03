"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api/use-api";
import type { components } from "@/lib/api/api";

type ReactionUsersPage = components["schemas"]["ReactionUsersPage"];
type PostId = components["schemas"]["PostId"];

interface UseReactionUsersPreviewArgs {
  postId: PostId;
  emoji: string;
  enabled?: boolean;
}

export function useReactionUsersPreview({
  postId,
  emoji,
  enabled = true,
}: UseReactionUsersPreviewArgs) {
  const api = useApi();
  return useQuery<ReactionUsersPage>({
    queryKey: ["reaction-users", postId, emoji, "preview"],
    enabled: enabled && Boolean(emoji),
    staleTime: 30_000,
    queryFn: async () => {
      const result = await api.reactionUsers(postId, { emoji, limit: 6 });
      if (!result.ok) {
        throw new Error(result.errorText || "Failed to fetch reaction users");
      }
      return result.data as ReactionUsersPage;
    },
  });
}

interface UseReactionUsersArgs {
  postId: PostId;
  emoji: string;
  enabled?: boolean;
}

export function useReactionUsers({
  postId,
  emoji,
  enabled = true,
}: UseReactionUsersArgs) {
  const api = useApi();
  return useInfiniteQuery<ReactionUsersPage>({
    queryKey: ["reaction-users", postId, emoji, "full"],
    enabled: enabled && Boolean(emoji),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    queryFn: async ({ pageParam }) => {
      const result = await api.reactionUsers(postId, {
        emoji,
        limit: 24,
        cursor: pageParam,
      });
      if (!result.ok) {
        throw new Error(result.errorText || "Failed to fetch reaction users");
      }
      return result.data as ReactionUsersPage;
    },
  });
}
