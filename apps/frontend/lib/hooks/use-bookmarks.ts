"use client";

import { useEffect, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useApi } from "@/lib/api/use-api";
import { queryKeys } from "@/lib/hooks/use-queries";
import type { components } from "@/lib/api/api";

export type BookmarkList = components["schemas"]["BookmarkList"];

/**
 * Where a post's current list membership lives on the client.
 *
 * The ids arrive embedded in every Post, so there is nothing to fetch — but a
 * post appears in a dozen differently shaped caches (timeline, thread, search,
 * a notification's embedded post…), and chasing all of them on every toggle is
 * how optimistic updates rot. One entry per post, seeded from whichever copy
 * rendered first, keeps every card showing the same state. Keyed by user so a
 * logout does not leave the next account looking at stale checkmarks.
 */
function postBookmarksKey(postId: string, userId?: string | null) {
  return ["postBookmarks", postId, userId ?? "anonymous"] as const;
}

export function useBookmarkLists(enabled = true) {
  const api = useApi();
  const auth = useAtomValue(authAtom);
  const isAuthenticated = auth.status === "ready" && !!auth.user;

  return useQuery({
    queryKey: queryKeys.bookmarkLists,
    queryFn: async () => {
      const result = await api.bookmarkLists();
      if (!result.ok) throw new Error(result.errorText);
      return result.data.items;
    },
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 60,
  });
}

export function useBookmarkListPosts(listId: string | undefined) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: queryKeys.bookmarkListPosts(listId ?? ""),
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const result = await api.bookmarkListPosts(listId!, { cursor: pageParam });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled: !!listId,
  });
}

export function useCreateBookmarkList() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: components["schemas"]["CreateBookmarkListRequest"]) => {
      const result = await api.createBookmarkList(body);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkLists });
    },
  });
}

export function useUpdateBookmarkList() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      ...body
    }: components["schemas"]["UpdateBookmarkListRequest"] & { listId: string }) => {
      const result = await api.updateBookmarkList(listId, body);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkLists });
    },
  });
}

export function useDeleteBookmarkList() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const result = await api.deleteBookmarkList(listId);
      if (!result.ok) throw new Error(result.errorText);
      return listId;
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkLists });
      queryClient.removeQueries({ queryKey: queryKeys.bookmarkListPosts(listId) });
    },
  });
}

/**
 * Drives one post's bookmark button: which lists hold it, and a toggle that
 * saves the whole set back.
 */
export function usePostBookmarks(postId: string, initialListIds?: string[]) {
  const api = useApi();
  const queryClient = useQueryClient();
  const auth = useAtomValue(authAtom);
  const currentUserId = auth.status === "ready" ? auth.user?.id ?? null : null;
  const isAuthenticated = currentUserId !== null;
  const key = useMemo(
    () => postBookmarksKey(postId, currentUserId),
    [postId, currentUserId],
  );

  // No initialData: "undefined" is what marks the entry as never seeded, and it
  // is the only signal that survives the component unmounting. With an initial
  // [] the entry would look written-to from the start, so the post's ids would
  // never land — and re-seeding on every mount would let a stale copy of the
  // post overwrite a toggle the user just made.
  const { data: listIds } = useQuery<string[]>({
    queryKey: key,
    queryFn: async () => [],
    enabled: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.setQueryData(key, [] as string[]);
      return;
    }
    if (!initialListIds) return;
    if (queryClient.getQueryData<string[]>(key) !== undefined) return;
    queryClient.setQueryData(key, initialListIds);
    // initialListIds is a fresh array on every render, so compare by content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, queryClient, key, initialListIds?.join(",")]);

  const { mutate: setLists, isPending } = useMutation({
    mutationFn: async (nextListIds: string[]) => {
      if (!isAuthenticated) throw new Error("loginRequired");
      const result = await api.setPostBookmarks(postId, { listIds: nextListIds });
      if (!result.ok) throw new Error(result.errorText || "Failed to save bookmark");
      return result.data;
    },
    onMutate: (nextListIds) => {
      const previous = queryClient.getQueryData<string[]>(key);
      queryClient.setQueryData(key, nextListIds);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data.listIds);
      // postCount moved, and a list page may have gained or lost this post.
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkLists });
      queryClient.invalidateQueries({ queryKey: ["bookmarkListPosts"] });
    },
  });

  const current = listIds ?? [];
  type SetListsOptions = Parameters<typeof setLists>[1];

  return {
    listIds: current,
    isBookmarked: current.length > 0,
    isPending,
    setLists,
    toggleList: (listId: string, options?: SetListsOptions) =>
      setLists(
        current.includes(listId)
          ? current.filter((id) => id !== listId)
          : [...current, listId],
        options,
      ),
  };
}
