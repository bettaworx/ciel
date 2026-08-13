"use client";

import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useApi } from "@/lib/api/use-api";
import type { components } from "@/lib/api/api";
import { ApiHttpError } from "@/lib/api/client";
import { collectOwnerReplyThreadChunk } from "@/lib/post-thread";
import { useSetAtom, useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { ERROR_CODES } from "@/lib/errors";
import type { FollowTab } from "@/lib/follow-tabs";
import type { OgpApiResponse } from "@/lib/ogp/types";

export type PostThreadParams = {
  anchorNodeId?: string;
  cursor?: string | null;
  depth?: number;
  childLimit?: number;
};

type NotificationType = components["schemas"]["NotificationType"];
type UnreadCount = components["schemas"]["UnreadCount"];
type UsersPage = components["schemas"]["UsersPage"];
type UserSearchPage = components["schemas"]["UserSearchPage"];

/** Notification list tabs. "mentions" covers everything addressed at you. */
export type NotificationTab = "all" | "mentions";


export const NOTIFICATION_TAB_TYPES: Record<
  NotificationTab,
  readonly NotificationType[] | undefined
> = {
  all: undefined,
  // A reply that also @-mentions you is stored as a single `reply` notification,
  // so the mentions tab has to ask for both types.
  mentions: ["mention", "reply"],
};

// Query keys
export const queryKeys = {
  me: ["me"] as const,
  serverInfo: ["serverInfo"] as const,
  serverConfig: ["serverConfig"] as const,
  customEmojis: ["customEmojis"] as const,
  adminSettings: ["adminSettings"] as const,
  // Prefix shared by every feed, so invalidating it refreshes all of them.
  timeline: ["timeline"] as const,
  globalTimeline: ["timeline", "global"] as const,
  homeTimeline: ["timeline", "home"] as const,
  post: (id: string) => ["post", id] as const,
  postContext: (id: string) => ["postContext", id] as const,
  postThread: (id: string, params?: PostThreadParams) =>
    ["postThread", id, params ?? {}] as const,
  replies: (postId: string) => ["replies", postId] as const,
  ownerReplyThread: (postId: string) => ["ownerReplyThread", postId] as const,
  user: (username: string) => ["user", username] as const,
  userPosts: (username: string) => ["userPosts", username] as const,
  // Prefix shared by every follow list, so one follow can patch all of them.
  follows: ["follows"] as const,
  followList: (username: string, tab: FollowTab) =>
    ["follows", username, tab] as const,
  followersYouFollowPreview: (username: string) =>
    ["followersYouFollowPreview", username] as const,
  reactions: (postId: string) => ["reactions", postId] as const,
  bookmarkLists: ["bookmarkLists"] as const,
  bookmarkListPosts: (listId: string) => ["bookmarkListPosts", listId] as const,
  agreementVersions: ["agreementVersions"] as const,
  latestAgreement: (type: "terms" | "privacy", language: string) =>
    ["latestAgreement", type, language] as const,
  adminAgreementDocuments: (params?: {
    limit?: number;
    offset?: number;
    status?: "draft" | "published";
    language?: "en" | "ja";
    type?: "terms" | "privacy";
  }) => ["adminAgreementDocuments", params] as const,
  adminAgreementDocument: (id: string) =>
    ["adminAgreementDocument", id] as const,
  adminAgreementHistory: (type: "terms" | "privacy", language: "en" | "ja") =>
    ["adminAgreementHistory", type, language] as const,
  adminInviteCodes: (params?: { limit?: number; offset?: number }) =>
    ["adminInviteCodes", params] as const,
  adminInviteCode: (id: string) => ["adminInviteCode", id] as const,
  adminInviteUsageHistory: (id: string) =>
    ["adminInviteUsageHistory", id] as const,
  adminEmojis: (params?: { limit?: number; offset?: number }) =>
    ["adminEmojis", params] as const,
  ogp: (url: string) => ["ogp", url] as const,
  notifications: (tab: NotificationTab) => ["notifications", tab] as const,
  notificationsUnread: ["notificationsUnread"] as const,
  followRequests: ["followRequests"] as const,
  // Prefix shared by both settings lists, so muting or blocking anyone marks
  // them stale without naming which one changed.
  hidden: ["hidden"] as const,
  hiddenList: (kind: "mutes" | "blocks") => ["hidden", kind] as const,
  searchPosts: (query: string) => ["search", "posts", query] as const,
  // Prefix shared by every user search, so one follow can patch all of them.
  searchUsersAll: ["search", "users"] as const,
  searchUsers: (query: string) => ["search", "users", query] as const,
};

// Current user
export function useMe() {
  const api = useApi();
  const authState = useAtomValue(authAtom);

  // Only fetch when auth is initialized and user exists
  // This prevents unnecessary 401 errors for unauthenticated users
  const shouldFetch = authState.status === "ready" && authState.user !== null;

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const result = await api.me();
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: shouldFetch, // Only fetch if authenticated
    retry: false, // Don't retry if not authenticated
    staleTime: 1000 * 60 * 5, // 5分
  });
}

// Server information (public endpoint)
// Updates are pushed via WebSocket (server_info_updated, user_registered/deleted, post_created/deleted).
// Re-synced to authoritative values on WebSocket connect/reconnect.
export function useServerInfo() {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.serverInfo,
    queryFn: async () => {
      const result = await api.serverInfo();
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    staleTime: Infinity,
  });
}

// Server configuration (public endpoint)
// Updates are pushed via WebSocket (server_config_updated).
// Re-synced to authoritative values on WebSocket connect/reconnect.
export function useServerConfig() {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.serverConfig,
    queryFn: async () => {
      const result = await api.serverConfig();
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    staleTime: Infinity,
  });
}

export function useCustomEmojis() {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.customEmojis,
    queryFn: async () => {
      const result = await api.listCustomEmojis({ limit: 200 });
      if (!result.ok) throw new Error(result.errorText);
      return result.data.emojis;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

// Media limits from server config
export function useMediaLimits() {
  const { data: serverConfig } = useServerConfig();

  return {
    maxUploadSizeMB: serverConfig?.mediaLimits?.maxUploadSizeMB ?? 15,
    maxUploadSizeBytes:
      (serverConfig?.mediaLimits?.maxUploadSizeMB ?? 15) * 1024 * 1024,
    allowedExtensions: serverConfig?.mediaLimits?.allowedExtensions ?? [
      "png",
      "jpg",
      "jpeg",
      "webp",
      "gif",
    ],
    postStaticMaxSize: serverConfig?.mediaLimits?.post?.static?.maxSize ?? 2048,
    postGifMaxSize: serverConfig?.mediaLimits?.post?.gif?.maxSize ?? 1024,
    avatarSize: serverConfig?.mediaLimits?.avatar?.size ?? 400,
    serverIconStaticSize:
      serverConfig?.mediaLimits?.serverIcon?.static?.size ?? 512,
    serverIconGifMaxSize:
      serverConfig?.mediaLimits?.serverIcon?.gif?.maxSize ?? 512,
    // Video limits
    videoMaxUploadSizeMB:
      serverConfig?.mediaLimits?.video?.maxUploadSizeMB ?? 100,
    videoMaxUploadSizeBytes:
      (serverConfig?.mediaLimits?.video?.maxUploadSizeMB ?? 100) * 1024 * 1024,
    videoMaxDurationSeconds:
      serverConfig?.mediaLimits?.video?.maxDurationSeconds ?? 300,
    videoMaxSize: serverConfig?.mediaLimits?.video?.maxSize ?? 1920,
    // Post content limits
    maxPostContentLength: serverConfig?.maxPostContentLength ?? 1000,
  };
}

// Timeline with infinite scroll
export function useTimeline(params?: { limit?: number; enabled?: boolean }) {
  const api = useApi();
  const { enabled = true, ...queryParams } = params ?? {};

  return useInfiniteQuery({
    queryKey: [...queryKeys.globalTimeline, queryParams],
    queryFn: async ({ pageParam }) => {
      const result = await api.timeline({
        limit: queryParams.limit ?? 30,
        cursor: pageParam ?? null,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60, // 1分
    enabled,
  });
}

// Home timeline (posts by you and everyone you follow) with infinite scroll.
//
// `enabled` lets the caller keep both timeline hooks mounted and only run the
// one being shown — hooks cannot be called conditionally.
export function useHomeTimeline(params?: { limit?: number; enabled?: boolean }) {
  const api = useApi();
  const { enabled = true, ...queryParams } = params ?? {};

  return useInfiniteQuery({
    queryKey: [...queryKeys.homeTimeline, queryParams],
    queryFn: async ({ pageParam }) => {
      const result = await api.homeTimeline({
        limit: queryParams.limit ?? 30,
        cursor: pageParam ?? null,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60, // 1分
    enabled,
  });
}

// Replies to a post with infinite scroll
export function useReplies(
  postId: string | undefined,
  params?: { limit?: number },
) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: postId
      ? [...queryKeys.replies(postId), params]
      : ["replies", "null"],
    queryFn: async ({ pageParam }) => {
      if (!postId) throw new Error(ERROR_CODES.POST_ID_REQUIRED);
      const result = await api.listReplies(postId, {
        limit: params?.limit ?? 30,
        cursor: pageParam ?? null,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    maxPages: 5,
    enabled: !!postId,
    staleTime: 1000 * 60, // 1分
  });
}

// Single post
export function usePost(postId: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: postId ? queryKeys.post(postId) : ["post", "null"],
    queryFn: async () => {
      if (!postId) throw new Error(ERROR_CODES.POST_ID_REQUIRED);
      const result = await api.getPost(postId);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: !!postId,
  });
}

export function usePostContext(postId: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: postId ? queryKeys.postContext(postId) : ["postContext", "null"],
    queryFn: async () => {
      if (!postId) throw new Error(ERROR_CODES.POST_ID_REQUIRED);
      const result = await api.getPostContext(postId);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: !!postId,
  });
}

export function usePostThread(
  postId: string | undefined,
  params?: PostThreadParams,
) {
  const api = useApi();
  const fetchPostThreadSlice = useCallback(
    async (targetPostId: string, sliceParams?: PostThreadParams) => {
      const result = await api.getPostThread(targetPostId, sliceParams);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    [api],
  );

  const query = useQuery({
    queryKey: postId
      ? queryKeys.postThread(postId, params)
      : ["postThread", "null"],
    queryFn: async () => {
      if (!postId) throw new Error(ERROR_CODES.POST_ID_REQUIRED);
      return fetchPostThreadSlice(postId, params);
    },
    enabled: !!postId,
    staleTime: 1000 * 60,
  });

  return {
    ...query,
    fetchPostThreadSlice,
  };
}

export function useOwnerReplyThread(post: components["schemas"]["Post"] | undefined) {
  const api = useApi();
  const fetchOwnerReplyThreadChunk = useCallback(
    async (
      parentPost: components["schemas"]["Post"],
      visitedPostIds?: Iterable<string>,
    ) =>
      collectOwnerReplyThreadChunk(parentPost, async (parentId, params) => {
        const result = await api.listReplies(parentId, params);
        if (!result.ok) throw new Error(result.errorText);
        return result.data;
      }, { visitedPostIds }),
    [api],
  );

  const query = useQuery({
    queryKey: post
      ? queryKeys.ownerReplyThread(post.id)
      : ["ownerReplyThread", "null"],
    queryFn: async () => {
      if (!post) throw new Error(ERROR_CODES.POST_ID_REQUIRED);
      return fetchOwnerReplyThreadChunk(post);
    },
    enabled: Boolean(post?.author?.id) && (post?.replyCount ?? 0) > 0,
    staleTime: 1000 * 60,
  });

  return {
    ...query,
    fetchOwnerReplyThreadChunk,
  };
}

// User by username
export function useUser(username: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: username ? queryKeys.user(username) : ["user", "null"],
    queryFn: async () => {
      if (!username) throw new Error(ERROR_CODES.USERNAME_REQUIRED);
      const result = await api.userByUsername(username);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: !!username,
  });
}

// Flips one user's follow state wherever a paged list of users is cached, so
// every button showing that user updates at once. Shared by the follow lists
// and the search results, whose pages differ in everything but `items`.
function patchFollowedUser<TPage extends { items: components["schemas"]["User"][] }>(
  cached: InfiniteData<TPage> | undefined,
  username: string,
  isFollowing: boolean,
): InfiniteData<TPage> | undefined {
  if (!cached) return cached;
  return {
    ...cached,
    pages: cached.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        item.username === username ? { ...item, isFollowing } : item,
      ),
    })),
  };
}

// Follow / unfollow a user.
//
// The endpoints return the updated user, so the profile cache is written
// directly from the response instead of being refetched.
function useFollowMutation(follow: boolean) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const result = follow
        ? await api.followUser(username)
        : await api.unfollowUser(username);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (user, username) => {
      queryClient.setQueryData(queryKeys.user(username), user);
      // Following changes who appears in the home timeline.
      queryClient.invalidateQueries({ queryKey: queryKeys.homeTimeline });
      // Patch the button state in every loaded follow list so it flips without
      // waiting on a refetch...
      queryClient.setQueriesData<InfiniteData<UsersPage>>(
        { queryKey: queryKeys.follows },
        (old) => patchFollowedUser(old, username, follow),
      );
      // ...and in search results, which show the same button. Following someone
      // does not change whether they match the query, so unlike the follow
      // lists these only need the patch, never a refetch.
      queryClient.setQueriesData<InfiniteData<UserSearchPage>>(
        { queryKey: queryKeys.searchUsersAll },
        (old) => patchFollowedUser(old, username, follow),
      );
      // ...but the lists also gained or lost a member, which no patch can fake:
      // mark them stale so revisiting one refetches instead of serving a list
      // the new follow is missing from.
      queryClient.invalidateQueries({ queryKey: queryKeys.follows });
      // Follower/following counts, and who shows up in the facepile.
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({
        queryKey: ["followersYouFollowPreview"],
      });
    },
  });
}

export function useFollowUser() {
  return useFollowMutation(true);
}

export function useUnfollowUser() {
  return useFollowMutation(false);
}

// Mute / unmute / block / unblock.
//
// Every feed and list changes membership here, and no patch can fake that: a
// muted author's posts leave both timelines, their name leaves the follow and
// reaction lists and user search, and their notifications stop appearing. So
// this invalidates broadly rather than editing caches in place. The profile
// itself is written straight from the response, as follow does.
//
// Blocking additionally severs both follows, which is why it invalidates the
// follow lists and the facepile that muting leaves alone.
function useHideMutation(kind: "mute" | "block", on: boolean) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const call =
        kind === "mute"
          ? on
            ? api.muteUser
            : api.unmuteUser
          : on
            ? api.blockUser
            : api.unblockUser;
      const result = await call(username);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (user, username) => {
      queryClient.setQueryData(queryKeys.user(username), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
      queryClient.invalidateQueries({ queryKey: queryKeys.userPosts(username) });
      // Individually cached posts carry the author flags that draw the indicator
      // and the reveal cushion. Timeline reply parents and boosted posts are
      // fetched this way, so without this they keep rendering uncushioned until
      // the entry expires.
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
      queryClient.invalidateQueries({ queryKey: ["postThread"] });
      queryClient.invalidateQueries({ queryKey: ["postContext"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.searchUsersAll });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
      queryClient.invalidateQueries({ queryKey: queryKeys.hidden });
      queryClient.invalidateQueries({ queryKey: queryKeys.follows });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({
        queryKey: ["followersYouFollowPreview"],
      });
    },
  });
}

export function useMuteUser() {
  return useHideMutation("mute", true);
}

export function useUnmuteUser() {
  return useHideMutation("mute", false);
}

export function useBlockUser() {
  return useHideMutation("block", true);
}

export function useUnblockUser() {
  return useHideMutation("block", false);
}

// The settings lists of muted and blocked accounts, with infinite scroll.
export function useHiddenList(kind: "mutes" | "blocks") {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: queryKeys.hiddenList(kind),
    queryFn: async ({ pageParam }: { pageParam?: string | null }) => {
      const result = await api.hiddenList(kind, { limit: 30, cursor: pageParam });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last: UsersPage) => last.nextCursor ?? undefined,
  });
}

// One of the three follow lists, with infinite scroll.
export function useFollowList(username: string | undefined, tab: FollowTab) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: username
      ? queryKeys.followList(username, tab)
      : ["follows", "null", tab],
    queryFn: async ({ pageParam }) => {
      if (!username) throw new Error(ERROR_CODES.USERNAME_REQUIRED);
      const result = await api.followList(username, tab, {
        limit: 30,
        cursor: pageParam ?? null,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
    staleTime: 1000 * 60,
  });
}

// The first few known followers plus a total, for the profile card facepile.
export function useFollowersYouFollowPreview(
  username: string | undefined,
  enabled: boolean,
) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.followersYouFollowPreview(username ?? ""),
    queryFn: async () => {
      if (!username) throw new Error(ERROR_CODES.USERNAME_REQUIRED);
      const result = await api.followList(username, "followers_you_follow", {
        limit: 3,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: enabled && !!username,
    staleTime: 1000 * 60 * 5,
  });
}

// User posts with infinite scroll
export function useUserPosts(
  username: string | undefined,
  params?: { limit?: number; mediaType?: "image" | "video" | "media"; onlyReplies?: boolean; excludeForeignReplies?: boolean },
) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: username
      ? [...queryKeys.userPosts(username), params]
      : ["userPosts", "null"],
    queryFn: async ({ pageParam }) => {
      if (!username) throw new Error(ERROR_CODES.USERNAME_REQUIRED);
      const result = await api.userPosts(username, {
        limit: params?.limit ?? 30,
        cursor: pageParam ?? null,
        mediaType: params?.mediaType,
        onlyReplies: params?.onlyReplies,
        excludeForeignReplies: params?.excludeForeignReplies,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
    staleTime: 1000 * 60, // 1分
  });
}

// Create post mutation
export function useCreatePost() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: components["schemas"]["CreatePostRequest"]) => {
      const result = await api.createPost(body); // Cookie-based auth
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate timeline to show new post
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
    },
  });
}

// Delete post mutation
export function useDeletePost() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const result = await api.deletePost(postId); // Cookie-based auth
      if (!result.ok) throw new Error(result.errorText);
    },
    onSuccess: (_, postId) => {
      // Deletion can affect timelines, detail context, reply counts, and
      // any currently expanded thread slice.
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
      queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.postContext(postId),
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "postThread" ||
          query.queryKey[0] === "replies" ||
          query.queryKey[0] === "ownerReplyThread" ||
          query.queryKey[0] === "userPosts",
      });
    },
  });
}

// Upload media mutation
export function useUploadMedia() {
  const api = useApi();

  return useMutation({
    mutationFn: async (file: File) => {
      const result = await api.uploadMedia(file); // Cookie-based auth
      if (!result.ok) {
        throw new ApiHttpError(result.errorText, result.status, result.headers);
      }
      return result.data;
    },
  });
}

// Reaction counts
export function useReactionCounts(postId: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: postId ? queryKeys.reactions(postId) : ["reactions", "null"],
    queryFn: async () => {
      if (!postId) throw new Error(ERROR_CODES.POST_ID_REQUIRED);
      const result = await api.reactionCounts(postId);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: !!postId,
  });
}

// Add reaction mutation
export function useAddReaction() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      emoji,
    }: {
      postId: string;
      emoji: string;
    }) => {
      const result = await api.addReaction(postId, { emoji }); // Cookie-based auth
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Update reaction counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.reactions(variables.postId),
      });
    },
  });
}

// Remove reaction mutation
export function useRemoveReaction() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      emoji,
    }: {
      postId: string;
      emoji: string;
    }) => {
      const result = await api.removeReaction(postId, emoji); // Cookie-based auth
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Update reaction counts
      queryClient.invalidateQueries({
        queryKey: queryKeys.reactions(variables.postId),
      });
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const api = useApi();
  const queryClient = useQueryClient();
  const setAuth = useSetAtom(authAtom);

  return useMutation({
    mutationFn: async (body: components["schemas"]["UpdateProfileRequest"]) => {
      const result = await api.updateProfile(body); // Cookie-based auth
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (updatedUser) => {
      // Update authAtom with new user data
      setAuth((prev) => ({
        ...prev,
        user: updatedUser,
      }));
      // Invalidate current user query
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

// Turns the account's private mode on or off.
//
// The invalidation list is deliberately wide. Every cached feed, profile and
// post the client is holding was fetched under the old visibility, and the
// default staleTime is a minute with no refetch on window focus — so without
// this a tab left open would keep rendering the old state for up to a minute
// after the switch. Server responses are already correct; this is what makes the
// screen agree with them straight away.
export function useUpdatePrivacy() {
  const api = useApi();
  const queryClient = useQueryClient();
  const setAuth = useSetAtom(authAtom);

  return useMutation({
    mutationFn: async (isPrivate: boolean) => {
      const result = await api.updatePrivacy({ isPrivate });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (updatedUser) => {
      setAuth((prev) => ({ ...prev, user: updatedUser }));
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
      queryClient.invalidateQueries({ queryKey: queryKeys.follows });
      queryClient.invalidateQueries({ queryKey: queryKeys.followRequests });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// Follow requests waiting on the current user. Only a private account has any.
export function useFollowRequests(options?: { enabled?: boolean }) {
  const api = useApi();
  const { enabled = true } = options ?? {};

  return useInfiniteQuery({
    queryKey: queryKeys.followRequests,
    queryFn: async ({ pageParam }: { pageParam?: string | null }) => {
      const result = await api.followRequests({ limit: 30, cursor: pageParam });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled,
  });
}

// Approving or declining both refresh the same set: the request list shrinks,
// and the requester's follow state on any profile the client is holding changes.
function useFollowRequestDecision(decide: "accept" | "reject") {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const result =
        decide === "accept"
          ? await api.acceptFollowRequest(username)
          : await api.rejectFollowRequest(username);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.followRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.follows });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(user.username) });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
    },
  });
}

export function useAcceptFollowRequest() {
  return useFollowRequestDecision("accept");
}

export function useRejectFollowRequest() {
  return useFollowRequestDecision("reject");
}

// Agreement versions (public endpoint)
export function useAgreementVersions(options?: { enabled?: boolean }) {
  const api = useApi();
  const { enabled = true } = options ?? {};

  return useQuery({
    queryKey: queryKeys.agreementVersions,
    queryFn: async () => {
      const result = await api.getAgreementVersions();
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled, // Only fetch if enabled
    staleTime: 1000 * 60 * 60, // 1時間 - 規約バージョンは頻繁に変わらない
  });
}

// Latest agreement document (public endpoint)
export function useLatestAgreement(
  type: "terms" | "privacy",
  language: string,
  enabled = true,
) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.latestAgreement(type, language),
    queryFn: async () => {
      const result = await api.getLatestAgreement(type, language);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled, // Only fetch if enabled
    staleTime: 1000 * 60 * 60, // 1時間 - 規約内容は頻繁に変わらない
  });
}

// Accept agreements mutation
export function useAcceptAgreements() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: components["schemas"]["AcceptAgreementsRequest"],
    ) => {
      const result = await api.acceptAgreements(body);
      if (!result.ok) throw new Error(result.errorText);
    },
    onSuccess: async () => {
      // Refetch current user to refresh agreement status
      await queryClient.refetchQueries({ queryKey: queryKeys.me });
    },
  });
}

// Update agreement versions (admin only)
export function useUpdateAgreementVersions() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: components["schemas"]["UpdateAgreementVersionsRequest"],
    ) => {
      const result = await api.adminUpdateAgreementVersions(body);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate agreement versions
      queryClient.invalidateQueries({ queryKey: queryKeys.agreementVersions });
    },
  });
}

// Update avatar mutation
export function useUpdateAvatar() {
  const api = useApi();
  const queryClient = useQueryClient();
  const setAuth = useSetAtom(authAtom);

  return useMutation({
    mutationFn: async (file: File) => {
      const result = await api.updateAvatar(file); // Cookie-based auth
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: async (updatedUser) => {
      // Update authAtom with new user data (including avatarUrl)
      setAuth((prev) => ({
        ...prev,
        user: updatedUser,
      }));
      // Invalidate current user query
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

// Update banner mutation
export function useUpdateBanner() {
  const api = useApi();
  const queryClient = useQueryClient();
  const setAuth = useSetAtom(authAtom);

  return useMutation({
    mutationFn: async (file: File) => {
      const result = await api.updateBanner(file);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: async (updatedUser) => {
      setAuth((prev) => ({
        ...prev,
        user: updatedUser,
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

// ==================== Admin Agreement Documents ====================

// List agreement documents (admin only)
export function useAdminAgreementDocuments(params?: {
  limit?: number;
  offset?: number;
  status?: "draft" | "published";
  language?: "en" | "ja";
  type?: "terms" | "privacy";
}) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.adminAgreementDocuments(params),
    queryFn: async () => {
      const result = await api.adminListAgreementDocuments(params);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    staleTime: 1000 * 60, // 1分
  });
}

// Get single agreement document (admin only)
export function useAdminAgreementDocument(documentId: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: documentId
      ? queryKeys.adminAgreementDocument(documentId)
      : ["adminAgreementDocument", "null"],
    queryFn: async () => {
      if (!documentId) throw new Error("Document ID required");
      const result = await api.adminGetAgreementDocument(documentId);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: !!documentId,
  });
}

// Get agreement history (admin only)
export function useAdminAgreementHistory(
  type: "terms" | "privacy",
  language: "en" | "ja",
) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.adminAgreementHistory(type, language),
    queryFn: async () => {
      const result = await api.adminGetAgreementHistory({ type, language });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    staleTime: 1000 * 60, // 1分
  });
}

// Create agreement document (admin only)
export function useAdminCreateAgreementDocument() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: components["schemas"]["CreateAgreementDocumentRequest"],
    ) => {
      const result = await api.adminCreateAgreementDocument(body);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate all agreement documents queries (with any params)
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminAgreementDocuments",
      });
    },
  });
}

// Update agreement document (admin only)
export function useAdminUpdateAgreementDocument(documentId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: components["schemas"]["UpdateAgreementDocumentRequest"],
    ) => {
      const result = await api.adminUpdateAgreementDocument(documentId, body);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate agreement documents list and single document
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminAgreementDocuments",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminAgreementDocument(documentId),
      });
    },
  });
}

// Publish agreement document (admin only)
export function useAdminPublishAgreementDocument() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await api.adminPublishAgreementDocument(documentId);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (data, documentId) => {
      // Invalidate agreement documents list and single document
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminAgreementDocuments",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminAgreementDocument(documentId),
      });
    },
  });
}

// Delete agreement document (admin only)
export function useAdminDeleteAgreementDocument() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const result = await api.adminDeleteAgreementDocument(documentId);
      if (!result.ok) throw new Error(result.errorText);
    },
    onSuccess: () => {
      // Invalidate agreement documents list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminAgreementDocuments",
      });
    },
  });
}

// Duplicate agreement document (admin only)
export function useAdminDuplicateAgreementDocument(documentId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newVersion: number) => {
      const result = await api.adminDuplicateAgreementDocument(documentId, {
        newVersion,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate agreement documents list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminAgreementDocuments",
      });
    },
  });
}

// ==================== Admin - Invite Codes ====================

// ==================== Admin - Emojis ====================

export function useAdminEmojis(params?: {
  limit?: number;
  offset?: number;
}) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.adminEmojis(params),
    queryFn: async () => {
      const result = await api.adminListEmojis(params);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useAdminCreateEmoji() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: FormData) => {
      const result = await api.adminCreateEmoji(form);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminEmojis",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customEmojis });
    },
  });
}

export function useAdminUpdateEmoji(emojiId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: FormData) => {
      const result = await api.adminUpdateEmoji(emojiId, form);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminEmojis",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customEmojis });
    },
  });
}

export function useAdminDeleteEmoji() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emojiId: string) => {
      const result = await api.adminDeleteEmoji(emojiId);
      if (!result.ok) throw new Error(result.errorText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminEmojis",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customEmojis });
    },
  });
}

// ==================== Admin - Invite Codes ====================

// List invite codes (admin only)
export function useAdminInviteCodes(params?: {
  limit?: number;
  offset?: number;
}) {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.adminInviteCodes(params),
    queryFn: async () => {
      const result = await api.adminListInviteCodes(params);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    staleTime: 1000 * 60, // 1分
  });
}

// Get single invite code (admin only)
export function useAdminInviteCode(inviteId: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: inviteId
      ? queryKeys.adminInviteCode(inviteId)
      : ["adminInviteCode", "null"],
    queryFn: async () => {
      if (!inviteId) throw new Error("Invite ID required");
      const result = await api.adminGetInviteCode(inviteId);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: !!inviteId,
  });
}

// Get invite code usage history (admin only)
export function useAdminInviteUsageHistory(inviteId: string | undefined) {
  const api = useApi();

  return useQuery({
    queryKey: inviteId
      ? queryKeys.adminInviteUsageHistory(inviteId)
      : ["adminInviteUsageHistory", "null"],
    queryFn: async () => {
      if (!inviteId) throw new Error("Invite ID required");
      const result = await api.adminGetInviteUsageHistory(inviteId);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: !!inviteId,
  });
}

// Create invite code (admin only)
export function useAdminCreateInviteCode() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: components["schemas"]["CreateInviteCodeRequest"],
    ) => {
      const result = await api.adminCreateInviteCode(body);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate invite codes list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminInviteCodes",
      });
    },
  });
}

// Update invite code (admin only)
export function useAdminUpdateInviteCode(inviteId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      body: components["schemas"]["UpdateInviteCodeRequest"],
    ) => {
      const result = await api.adminUpdateInviteCode(inviteId, body);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      // Invalidate invite codes list and single invite
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminInviteCodes",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminInviteCode(inviteId),
      });
    },
  });
}

// Disable invite code (admin only)
export function useAdminDisableInviteCode() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const result = await api.adminDisableInviteCode(inviteId);
      if (!result.ok) throw new Error(result.errorText);
    },
    onSuccess: (data, inviteId) => {
      // Invalidate invite codes list and single invite
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminInviteCodes",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminInviteCode(inviteId),
      });
    },
  });
}

// Delete invite code (admin only)
export function useAdminDeleteInviteCode() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const result = await api.adminDeleteInviteCode(inviteId);
      if (!result.ok) throw new Error(result.errorText);
    },
    onSuccess: () => {
      // Invalidate invite codes list
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "adminInviteCodes",
      });
    },
  });
}

// ==================== Server Settings ====================

// Get admin settings
export function useAdminSettings() {
  const api = useApi();

  return useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: async () => {
      const result = await api.adminSettings();
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
  });
}

// Update server profile (name, description, icon)
export function useUpdateServerProfile() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      serverName?: string;
      serverDescription?: string;
      serverIconMediaId?: string;
    }) => {
      const result = await api.setupComplete(data);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serverInfo });
    },
  });
}

// Update signup settings (invite-only mode)
export function useUpdateSignupSettings() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signupEnabled: boolean) => {
      const result = await api.adminUpdateSignupEnabled({ signupEnabled });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings });
      queryClient.invalidateQueries({ queryKey: queryKeys.serverInfo });
    },
  });
}

// ---------------------------------------------------------------------------
// OGP (Open Graph Protocol) link preview
// ---------------------------------------------------------------------------

const OGP_STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch OGP metadata for a URL via the frontend OGP preview endpoint.
 *
 * - Only executes when `url` is non-null.
 * - Aggressively caches (24 h staleTime + gcTime).
 * - Does not retry on failure (most OGP failures are permanent).
 */
export function useOgp(url: string | null) {
  return useQuery({
    queryKey: queryKeys.ogp(url ?? ""),
    queryFn: async () => {
      const res = await fetch(`/internal/ogp?url=${encodeURIComponent(url!)}`);
      const json: OgpApiResponse = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "Failed to fetch OGP");
      }
      return json.data;
    },
    enabled: !!url,
    staleTime: OGP_STALE_TIME,
    gcTime: OGP_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/** Notification list for the given tab, paged by cursor. */
export function useNotifications(tab: NotificationTab) {
  const api = useApi();
  const authState = useAtomValue(authAtom);
  const shouldFetch = authState.status === "ready" && authState.user !== null;

  return useInfiniteQuery({
    queryKey: queryKeys.notifications(tab),
    queryFn: async ({ pageParam }) => {
      const result = await api.notifications({
        limit: 30,
        cursor: pageParam ?? null,
        types: NOTIFICATION_TAB_TYPES[tab],
        // Groups are cut at the day boundary; read inside queryFn so the zone is
        // the browser's, not the rendering server's.
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: shouldFetch,
    staleTime: 1000 * 30,
  });
}

/**
 * Unread badge count. Kept fresh by the realtime `notification_created` event
 * and by mark-as-read, so it does not need to poll.
 */
export function useUnreadNotificationCount() {
  const api = useApi();
  const authState = useAtomValue(authAtom);
  const shouldFetch = authState.status === "ready" && authState.user !== null;

  return useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: async () => {
      const result = await api.unreadNotificationCount();
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5,
  });
}

/** Marks the given notifications read, or every unread one when `ids` is omitted. */
export function useMarkNotificationsRead() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids?: readonly string[]) => {
      const result = await api.markNotificationsRead(ids);
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    onSuccess: (unread, ids) => {
      queryClient.setQueryData<UnreadCount>(queryKeys.notificationsUnread, unread);
      markNotificationsReadInCache(queryClient, ids);
    },
  });
}

/**
 * Stamps `readAt` on cached notifications so the unread highlight clears without
 * refetching. Passing no ids marks every cached notification read.
 */
export function markNotificationsReadInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  ids?: readonly string[],
) {
  const idSet = ids ? new Set(ids) : null;
  const readAt = new Date().toISOString();

  queryClient.setQueriesData<{
    pages?: Array<{ items?: components["schemas"]["Notification"][] }>;
  }>(
    { predicate: (query) => query.queryKey[0] === "notifications" },
    (payload) => {
      if (!payload || !Array.isArray(payload.pages)) return payload;
      let changed = false;
      const pages = payload.pages.map((page) => {
        if (!page || !Array.isArray(page.items)) return page;
        let pageChanged = false;
        const items = page.items.map((item) => {
          if (item.readAt || (idSet && !idSet.has(item.id))) return item;
          pageChanged = true;
          return { ...item, readAt };
        });
        if (!pageChanged) return page;
        changed = true;
        return { ...page, items };
      });
      return changed ? { ...payload, pages } : payload;
    },
  );
}

const SEARCH_PAGE_SIZE = 30;

/** The API rejects offsets past this, so stop paging instead of asking for a 400. */
const MAX_SEARCH_OFFSET = 1000;

/**
 * Works out the next offset from what the page reports about itself.
 *
 * Counting the returned items would be wrong: hydration drops posts deleted or
 * hidden since they were indexed, so a short page is not necessarily the last
 * one. The echoed offset and limit describe the window that was asked for,
 * which is what has to advance.
 */
function nextSearchOffset(page: { offset: number; limit: number; estimatedTotal: number }) {
  const next = page.offset + page.limit;
  if (next >= page.estimatedTotal || next > MAX_SEARCH_OFFSET) return undefined;
  return next;
}

/** Post search results in relevance order. Pass enabled: false for the hidden tab. */
export function useSearchPosts(query: string, enabled = true) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: queryKeys.searchPosts(query),
    queryFn: async ({ pageParam }) => {
      const result = await api.searchPosts({
        q: query,
        limit: SEARCH_PAGE_SIZE,
        offset: pageParam,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: 0,
    getNextPageParam: nextSearchOffset,
    enabled: enabled && query.length > 0,
    // A rejected query syntax and an unconfigured engine both fail the same way
    // on every attempt, and retrying only eats into the search rate limit.
    retry: false,
    staleTime: 1000 * 60,
  });
}

/** User search results in relevance order. */
export function useSearchUsers(query: string, enabled = true) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: queryKeys.searchUsers(query),
    queryFn: async ({ pageParam }) => {
      const result = await api.searchUsers({
        q: query,
        limit: SEARCH_PAGE_SIZE,
        offset: pageParam,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: 0,
    getNextPageParam: nextSearchOffset,
    enabled: enabled && query.length > 0,
    // A rejected query syntax and an unconfigured engine both fail the same way
    // on every attempt, and retrying only eats into the search rate limit.
    retry: false,
    staleTime: 1000 * 60,
  });
}
