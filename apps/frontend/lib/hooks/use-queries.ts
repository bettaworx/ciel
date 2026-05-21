"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useApi } from "@/lib/api/use-api";
import type { components } from "@/lib/api/api";
import { ApiHttpError } from "@/lib/api/client";
import { useSetAtom, useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { ERROR_CODES } from "@/lib/errors";
import type { OgpApiResponse } from "@/lib/ogp/types";

// Query keys
export const queryKeys = {
  me: ["me"] as const,
  serverInfo: ["serverInfo"] as const,
  serverConfig: ["serverConfig"] as const,
  customEmojis: ["customEmojis"] as const,
  adminSettings: ["adminSettings"] as const,
  timeline: ["timeline"] as const,
  post: (id: string) => ["post", id] as const,
  user: (username: string) => ["user", username] as const,
  userPosts: (username: string) => ["userPosts", username] as const,
  reactions: (postId: string) => ["reactions", postId] as const,
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
export function useTimeline(params?: { limit?: number }) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: [...queryKeys.timeline, params],
    queryFn: async ({ pageParam }) => {
      const result = await api.timeline({
        limit: params?.limit ?? 30,
        cursor: pageParam ?? null,
      });
      if (!result.ok) throw new Error(result.errorText);
      return result.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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

// User posts with infinite scroll
export function useUserPosts(
  username: string | undefined,
  params?: { limit?: number; mediaType?: "image" | "video" | "media" },
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
    onSuccess: () => {
      // Invalidate timeline and posts
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
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
