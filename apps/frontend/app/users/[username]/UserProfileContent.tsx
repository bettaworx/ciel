"use client";

import React, { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUser,
  usePost,
  useUserPosts,
  useUpdateProfile,
  useUpdateAvatar,
  useUpdateBanner,
  useFollowersYouFollowPreview,
  queryKeys,
} from "@/lib/hooks/use-queries";
import type { components } from "@/lib/api/api";
import { userAtom } from "@/atoms/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clipboard,
  Lock,
  Ban,
  VolumeX,
  MoreHorizontal,
  Pencil,
  Rocket,
  Share,
  User,
  X,
  Save,
  Upload,
} from "lucide-react";
import { FollowButton } from "@/components/users/FollowButton";
import { PageContainer } from "@/components/PageContainer";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { useOwnerThreadTimelineItems } from "@/lib/hooks/use-owner-thread-timeline-items";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DisplayName } from "@/components/users/DisplayName";
import { BIO_ALLOW_LIST } from "@/lib/mfm/parse";
import { PostCard } from "@/components/PostCard";
import { PrivateParentPostCard } from "@/components/PrivateParentPostCard";
import { DeletedPostCard } from "@/components/DeletedPostCard";
import { OwnerThreadTimelineItem } from "@/components/OwnerThreadTimelineItem";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { getBlurhashDataUrl } from "@/lib/blurhash";
import { toast } from "sonner";
import { useHideUserActions } from "@/lib/hooks/use-hide-user-actions";

function ProfileParentPostSkeleton() {
  return (
    <article aria-hidden className="relative p-3 text-card-foreground">
      <span className="absolute left-8 sm:left-9 top-14 sm:top-16 bottom-0 w-0.5 -translate-x-1/2 bg-border" />
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-2/3 max-w-xs" />
        </div>
      </div>
    </article>
  );
}

type Post = components["schemas"]["Post"];

function isPureBoost(post: Post): boolean {
  return post.content === "" && !!post.referenceId;
}

type ProfilePostItemProps = {
  post: Post;
  isLast: boolean;
  onUserClick: (username: string) => void;
  /**
   * True once the viewer has opened the muted/blocked gate above the tabs. Only
   * the profile owner's own cards inherit it; a reply parent by some *other*
   * hidden account still gets its own cushion, since the gate was never about
   * them.
   */
  revealHidden?: boolean;
};

function ProfilePostItem({ post, isLast, onUserClick, revealHidden }: ProfilePostItemProps) {
  const t = useTranslations();
  const pureBoost = isPureBoost(post);
  const boostReferenceId = pureBoost ? post.referenceId! : undefined;
  const parentId = pureBoost ? undefined : (post.parentId ?? undefined);
  // The parent belongs to a private account this viewer does not follow. Asking
  // for it would only ever 404, so it is not fetched at all and a redacted card
  // stands in for it. A follower gets parentPrivate false and the real parent.
  const parentHidden = !pureBoost && Boolean(post.parentPrivate);
  const { data: boostedPost } = usePost(boostReferenceId);
  const {
    data: parentPost,
    isLoading: isParentLoading,
    isFetching: isParentFetching,
  } = usePost(parentHidden ? undefined : parentId);
  const showParentSkeleton =
    Boolean(parentId) &&
    !parentHidden &&
    !parentPost &&
    (isParentLoading || isParentFetching);
  const hasVisibleParent = Boolean(parentPost || showParentSkeleton || parentHidden);

  if (pureBoost) {
    const displayPost = boostedPost ?? post.reference;
    const boostIndicator = {
      icon: <Rocket className="h-3.5 w-3.5" />,
      label: t("postCard.actions.boostedBy", {
        name: post.author.displayName || post.author.username,
      }),
      createdAt: post.createdAt,
      sourcePostId: post.id,
      actorUserId: post.author.id,
    };
    if (!displayPost) {
      return (
        <DeletedPostCard
          referenceId={post.referenceId!}
          variant="timeline"
          isLast={isLast}
          indicator={boostIndicator}
          restricted={post.referenceRestricted}
        />
      );
    }
    return (
      <PostCard
        post={displayPost}
        onUserClick={onUserClick}
        isLast={isLast}
        indicator={boostIndicator}
        skipHiddenCushion={revealHidden}
      />
    );
  }

  if (!parentId || !hasVisibleParent) {
    return (
      <PostCard
        post={post}
        onUserClick={onUserClick}
        isLast={isLast}
        skipHiddenCushion={revealHidden}
      />
    );
  }

  return (
    <>
      {parentHidden ? (
        <PrivateParentPostCard threadLine="below" />
      ) : parentPost ? (
        <PostCard
          post={parentPost}
          onUserClick={onUserClick}
          isLast={false}
          variant="timeline"
          threadLine="below"
        />
      ) : (
        <ProfileParentPostSkeleton />
      )}
      <PostCard
        post={post}
        onUserClick={onUserClick}
        isLast={isLast}
        threadLine="above"
        skipHiddenCushion={revealHidden}
      />
    </>
  );
}

const DEFAULT_BANNER_URL = "/assets/Default-Banner.png";

type UserProfileContentProps = {
  username: string;
};

export function UserProfileContent({ username }: UserProfileContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const authUser = useAtomValue(userAtom);
  const isOwnProfile = authUser?.username === username;

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUser(username);

  const isFollowing = user?.isFollowing ?? false;
  const isFollowedBy = user?.isFollowedBy ?? false;
  const showsFollowsYouBadge = isFollowedBy && !isOwnProfile;

  // A private account's activity is for accepted followers and the owner only.
  // The server enforces this; the flag exists so the page can say why the tabs
  // are missing instead of showing three empty ones.
  const isActivityHidden =
    Boolean(user?.isPrivate) && !isOwnProfile && !isFollowing;
  // The viewer muted or blocked this account. Unlike isActivityHidden the server
  // does return the posts — a profile is somewhere you arrive on purpose — so
  // this gates them behind one reveal rather than explaining an emptiness.
  const hiddenByViewer =
    !isOwnProfile && (Boolean(user?.isBlocking) || Boolean(user?.isMuted));
  const [profileRevealed, setProfileRevealed] = useState(false);
  const showHiddenGate = hiddenByViewer && !profileRevealed;
  // The other direction. The server withholds everything here, so this is the
  // page saying why rather than a filter.
  const isBlockedByUser = Boolean(user?.isBlockedBy);
  // The server blanks the bio across a block in either direction. Muting does
  // not: it hides a feed, it does not cut the two accounts off from each other.
  const bioWithheld = isBlockedByUser || Boolean(user?.isBlocking);
  const { actions: hideActions, dialog: hideDialog } = useHideUserActions(
    username,
    { isMuted: user?.isMuted, isBlocking: user?.isBlocking },
  );
  // Undefined rather than zero is how the API says "withheld", so the presence
  // of the field is the signal, not its value.
  const hasFollowCounts =
    user?.followersCount !== undefined && user?.followingCount !== undefined;

  // "Followers you know" is only meaningful about someone else, while logged in.
  const { data: knownFollowers } = useFollowersYouFollowPreview(
    username,
    !!authUser && !isOwnProfile,
  );
  const knownFollowerCount = knownFollowers?.totalCount ?? 0;
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPosts(username, { excludeForeignReplies: true });
  const {
    data: repliesData,
    isLoading: repliesLoading,
    error: repliesError,
    fetchNextPage: fetchNextRepliesPage,
    hasNextPage: hasNextRepliesPage,
    isFetchingNextPage: isFetchingNextRepliesPage,
  } = useUserPosts(username, { onlyReplies: true });
  const {
    data: mediaData,
    isLoading: mediaLoading,
    error: mediaError,
    fetchNextPage: fetchNextMediaPage,
    hasNextPage: hasNextMediaPage,
    isFetchingNextPage: isFetchingNextMediaPage,
  } = useUserPosts(username, { mediaType: "media" });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Banner upload state
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(
    null,
  );
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropAspect, setCropAspect] = useState<number>(1);
  const [cropTitle, setCropTitle] = useState<string>("");
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(
    null,
  );
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

  // Mutations
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const updateBanner = useUpdateBanner();
  const isSaving =
    updateProfile.isPending || updateAvatar.isPending || updateBanner.isPending;
  const normalizedDisplayName = editDisplayName.trim() || null;
  const normalizedBio = editBio.trim() || null;
  const hasTextChanges =
    normalizedDisplayName !== (user?.displayName ?? null) ||
    normalizedBio !== (user?.bio ?? null);
  const hasImageChanges = Boolean(selectedAvatarFile || selectedBannerFile);
  const canSaveProfile = hasTextChanges || hasImageChanges;
  const postsInfiniteScrollRef = useInfiniteScroll({
    enabled: Boolean(hasNextPage),
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });
  const repliesInfiniteScrollRef = useInfiniteScroll({
    enabled: Boolean(hasNextRepliesPage),
    hasNextPage: Boolean(hasNextRepliesPage),
    isFetchingNextPage: isFetchingNextRepliesPage,
    fetchNextPage: fetchNextRepliesPage,
  });
  const mediaInfiniteScrollRef = useInfiniteScroll({
    enabled: Boolean(hasNextMediaPage),
    hasNextPage: Boolean(hasNextMediaPage),
    isFetchingNextPage: isFetchingNextMediaPage,
    fetchNextPage: fetchNextMediaPage,
  });

  const bannerBlurhashDataUrl = useMemo(
    () => getBlurhashDataUrl(user?.bannerBlurhash),
    [user?.bannerBlurhash],
  );
  const posts = useMemo(
    () => postsData?.pages.flatMap((page) => page.items ?? []) ?? [],
    [postsData],
  );
  const replies = useMemo(
    () => repliesData?.pages.flatMap((page) => page.items ?? []) ?? [],
    [repliesData],
  );
  const media = useMemo(
    () => mediaData?.pages.flatMap((page) => page.items ?? []) ?? [],
    [mediaData],
  );
  const postItems = useOwnerThreadTimelineItems(posts);
  const replyItems = useOwnerThreadTimelineItems(replies);

  const handleEditStart = () => {
    if (!user) return;
    setMenuOpen(false);
    setEditDisplayName(user.displayName || "");
    setEditBio(user.bio || "");
    setAvatarPreview(null);
    setSelectedAvatarFile(null);
    setBannerPreview(null);
    setSelectedBannerFile(null);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    setSelectedAvatarFile(null);
    setBannerPreview(null);
    setSelectedBannerFile(null);
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setPendingCropFile(null);
    setCropTarget(null);
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
    if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!canSaveProfile) return;

    try {
      if (selectedAvatarFile)
        await updateAvatar.mutateAsync(selectedAvatarFile);
      if (selectedBannerFile)
        await updateBanner.mutateAsync(selectedBannerFile);
      await updateProfile.mutateAsync({
        displayName: normalizedDisplayName,
        bio: normalizedBio,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.user(username),
      });
      toast.success(t("settings.profile.updateSuccess"));
      setIsEditing(false);
      setAvatarPreview(null);
      setSelectedAvatarFile(null);
      setBannerPreview(null);
      setSelectedBannerFile(null);
    } catch {
      toast.error(t("settings.profile.updateError"));
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropAspect(1);
      setCropTitle(t("settings.profile.avatar.cropTitle"));
      setCropTarget("avatar");
      setPendingCropFile(file);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropAspect(3);
      setCropTitle(t("settings.profile.banner.cropTitle"));
      setCropTarget("banner");
      setPendingCropFile(file);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile: File) => {
    const previewUrl = URL.createObjectURL(croppedFile);
    if (cropTarget === "avatar") {
      setAvatarPreview(previewUrl);
      setSelectedAvatarFile(croppedFile);
    } else if (cropTarget === "banner") {
      setBannerPreview(previewUrl);
      setSelectedBannerFile(croppedFile);
    }
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setPendingCropFile(null);
    setCropTarget(null);
  };

  const handleShareProfile = async () => {
    if (!user) return;
    const profileUrl = `${window.location.origin}/users/${username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: user.displayName || `@${user.username}`,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
      }
      toast.success(t("user.shareSuccess"));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      toast.error(t("user.shareError"));
    }
  };

  const handleCopyUserId = async () => {
    if (!user?.id) {
      toast.error(t("user.copyIdError"));
      return;
    }

    try {
      await navigator.clipboard.writeText(user.id);
      toast.success(t("user.copyIdSuccess"));
      setMenuOpen(false);
    } catch {
      toast.error(t("user.copyIdError"));
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="theme" label={t("loading")} />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold mb-2">
            {t("user.notFound")}
          </p>
          <p className="text-muted-foreground">{userError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer
      maxWidth="2xl"
      header={
        <PageHeader>
          <DisplayName
            name={user.displayName || `@${user.username}`}
            isPrivate={user.isPrivate}
            isMuted={user.isMuted}
            isBlocked={user.isBlocking}
          />
        </PageHeader>
      }
    >
      <div>
        {/* User Profile Header */}
        <div className="select-none bg-card rounded-2xl overflow-hidden mb-3">
          {/* Banner */}
          <div
            className={`w-full aspect-[3/1] bg-muted relative overflow-hidden ${isEditing ? "cursor-pointer" : ""}`}
            onClick={
              isEditing ? () => bannerFileInputRef.current?.click() : undefined
            }
          >
            {!isEditing && user.bannerUrl && bannerBlurhashDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerBlurhashDataUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                (isEditing
                  ? bannerPreview || user.bannerUrl
                  : user.bannerUrl) || DEFAULT_BANNER_URL
              }
              alt=""
              className="relative w-full h-full object-cover"
            />
            {isEditing && (
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFileSelect}
                className="hidden"
              />
            )}
            <div className="absolute top-3 right-3">
              {isEditing ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    bannerFileInputRef.current?.click();
                  }}
                  disabled={isSaving}
                  className="bg-black/50 text-white hover:bg-black/85 hover:text-white"
                >
                  {t("settings.profile.banner.change")}
                </Button>
              ) : isDesktop ? (
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label={t("user.moreActions")}
                      className="bg-black/50 text-white hover:bg-black/85 hover:text-white"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleShareProfile}>
                      <Share className="w-4 h-4" />
                      {t("user.shareProfile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleCopyUserId}>
                      <Clipboard className="w-4 h-4" />
                      {t("user.copyUserId")}
                    </DropdownMenuItem>
                    {hideActions.map((action) => (
                      <DropdownMenuItem
                        key={action.key}
                        onSelect={action.run}
                        className={action.destructive ? "text-destructive focus:text-destructive" : undefined}
                      >
                        {action.icon}
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label={t("user.moreActions")}
                      className="bg-black/50 text-white hover:bg-black/85 hover:text-white"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="flex flex-col gap-2 p-2 pb-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={handleShareProfile}
                      >
                        <Share className="w-4 h-4" />
                        {t("user.shareProfile")}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={handleCopyUserId}
                      >
                        <Clipboard className="w-4 h-4" />
                        {t("user.copyUserId")}
                      </Button>
                      {hideActions.map((action) => (
                        <Button
                          key={action.key}
                          variant="ghost"
                          className={
                            action.destructive
                              ? "w-full justify-start gap-2 text-destructive"
                              : "w-full justify-start gap-2"
                          }
                          onClick={() => {
                            // Blocking opens its own confirmation; two stacked
                            // drawers trap the dismiss.
                            setMenuOpen(false);
                            action.run();
                          }}
                        >
                          {action.icon}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </div>
            {showsFollowsYouBadge && (
              <div className="absolute top-3 left-3 border-transparent bg-black/50 text-white shadow-none rounded-full text-xs py-1.5 px-3">
                {t("user.followsYou")}
              </div>
            )}
          </div>

          <div className="px-3">
            {/* Avatar row + action buttons */}
            <div className="flex items-start h-12 sm:h-16 mb-3">
              <div className="relative shrink-0">
                {isEditing && (
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                )}

                <Avatar
                  className={`h-24 w-24 sm:h-32 sm:w-32 -mt-12 sm:-mt-16 rounded-[24px] sm:rounded-[32px] ring-4 ring-card ${isEditing ? "cursor-pointer" : ""}`}
                  onClick={
                    isEditing
                      ? () => avatarFileInputRef.current?.click()
                      : undefined
                  }
                >
                  <AvatarImage
                    src={
                      (isEditing
                        ? avatarPreview || user.avatarUrl
                        : user.avatarUrl) ?? undefined
                    }
                    alt={user.username}
                  />
                  <AvatarFallback className="rounded-[24px] sm:rounded-[32px]">
                    <User className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarFileInputRef.current?.click();
                    }}
                    disabled={isSaving}
                    className="absolute bottom-1 right-1 sm:hidden bg-black/50 text-white hover:bg-black/85 hover:text-white"
                    aria-label={t("settings.profile.avatar.change")}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Action row — justify-between, fills remaining width */}
              <div className="flex-1 pl-3 gap-2 pt-3 flex items-center justify-between">
                {/* Left: avatar change button (edit mode only) */}
                <div>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isSaving}
                      className="hidden sm:inline-flex"
                    >
                      {t("settings.profile.avatar.change")}
                    </Button>
                  )}
                </div>

                {/* Right: follow (others) / pencil / cancel + save */}
                <div className="flex items-center gap-2">
                  <FollowButton
                    username={username}
                    isFollowing={isFollowing}
                    isFollowedBy={isFollowedBy}
                    isPrivate={user.isPrivate}
                    followRequestSent={user.followRequestSent}
                    isBlockedBy={user.isBlockedBy}
                    isBlocking={user.isBlocking}
                  />
                  {isOwnProfile && !isEditing && (
                    <Button
                      variant="default"
                      size="icon"
                      onClick={handleEditStart}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isOwnProfile && isEditing && (
                    <>
                      <Button
                        variant="default"
                        size="icon"
                        className="md:w-auto md:px-3"
                        onClick={handleEditCancel}
                        disabled={isSaving}
                      >
                        <X className="w-4 h-4 md:mr-1" />
                        <span className="hidden md:inline">
                          {t("settings.profile.avatar.cancel")}
                        </span>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !canSaveProfile}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {isSaving
                          ? t("settings.profile.saving")
                          : t("settings.profile.saveChanges")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="select-text flex flex-col gap-2 pb-3">
              <div className="flex flex-col gap-1">
                {isEditing ? (
                  <Input
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder={t("settings.profile.displayName.placeholder")}
                    maxLength={50}
                    className="text-base font-bold md:text-xl"
                    disabled={isSaving}
                  />
                ) : (
                  <h1 className="text-xl font-bold text-foreground">
                    <DisplayName
                      name={user.displayName || `@${user.username}`}
                      isPrivate={user.isPrivate}
                      isMuted={user.isMuted}
                      isBlocked={user.isBlocking}
                    />
                  </h1>
                )}
                {user.displayName && (
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                )}
              </div>

              <div>
                {isEditing ? (
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder={t("settings.profile.bio.placeholder")}
                    maxLength={200}
                    rows={3}
                    className="resize-none text-sm"
                    disabled={isSaving}
                  />
                ) : (
                  <>
                    {/* Withheld across a block in either direction, and the
                        empty-bio placeholder goes with it: the server blanks the
                        text, so "No bio yet" would be the page inventing a fact
                        about an account it is not showing. */}
                    {!bioWithheld && user.bio && (
                      <div className="text-sm text-foreground leading-relaxed">
                        <MfmRenderer
                          text={user.bio}
                          allowList={BIO_ALLOW_LIST}
                        />
                      </div>
                    )}
                    {!bioWithheld && !user.bio && (
                      <p className="text-muted-foreground italic">
                        {t("user.noBio")}
                      </p>
                    )}
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="flex flex-col gap-2">
                  {/* The server omits both counts for a private account the
                      viewer may not see. Nothing is rendered then — falling back
                      to 0 would state a number the API deliberately withheld,
                      and the links lead to lists that are refused anyway. */}
                  {hasFollowCounts && (
                    <div className="flex items-center gap-4 text-sm">
                      <Link
                        href={`/users/${encodeURIComponent(username)}/following`}
                        className="text-muted-foreground hover:underline"
                      >
                        <span className="font-bold text-foreground">
                          {user.followingCount}
                        </span>{" "}
                        {t("user.followingCount")}
                      </Link>
                      <Link
                        href={`/users/${encodeURIComponent(username)}/followers`}
                        className="text-muted-foreground hover:underline"
                      >
                        <span className="font-bold text-foreground">
                          {user.followersCount}
                        </span>{" "}
                        {t("user.followersCount")}
                      </Link>
                    </div>
                  )}

                  {knownFollowerCount > 0 && knownFollowers && (
                    <Link
                      href={`/users/${encodeURIComponent(username)}/followers_you_follow`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                    >
                      <div className="flex -space-x-2">
                        {knownFollowers.items.map((known) => (
                          <Avatar
                            key={known.id}
                            className="h-5 w-5 ring-2 ring-card"
                          >
                            <AvatarImage
                              src={known.avatarUrl ?? undefined}
                              alt={known.displayName || `@${known.username}`}
                            />
                            <AvatarFallback className="text-[10px]">
                              {(known.displayName || known.username)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="truncate">
                        {knownFollowerCount > 1
                          ? t("user.followedByMany", {
                              name:
                                knownFollowers.items[0]?.displayName ||
                                `@${knownFollowers.items[0]?.username}`,
                              count: knownFollowerCount - 1,
                            })
                          : t("user.followedByOne", {
                              name:
                                knownFollowers.items[0]?.displayName ||
                                `@${knownFollowers.items[0]?.username}`,
                            })}
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* A private account still shows its profile above; only the activity
            below is withheld. The server already returns nothing here, so this
            is purely to explain the emptiness rather than to enforce it. */}
        {isBlockedByUser ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Ban className="h-8 w-8 text-destructive" />
            <p className="font-medium text-foreground">
              {t("user.blockedByUser")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("user.blockedByUserDescription")}
            </p>
          </div>
        ) : isActivityHidden ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-foreground">
              {t("user.privatePostsHidden")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("user.privatePostsHiddenDescription")}
            </p>
          </div>
        ) : showHiddenGate ? (
          /* One gate for the whole tab strip. Opening it shows the posts as
             normal — cushioning every row underneath would ask the same
             question again for every scroll. */
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            {user?.isBlocking ? (
              <Ban className="h-8 w-8 text-destructive" />
            ) : (
              <VolumeX className="h-8 w-8 text-destructive" />
            )}
            <p className="font-medium text-foreground">
              {user?.isBlocking
                ? t("user.blockedPostsHidden")
                : t("user.mutedPostsHidden")}
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={() => setProfileRevealed(true)}
            >
              {t("postCard.hiddenPost.reveal")}
            </Button>
          </div>
        ) : (
        <Tabs defaultValue="posts">
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="posts">{t("user.posts")}</TabsTrigger>
            <TabsTrigger value="replies">{t("user.replies")}</TabsTrigger>
            <TabsTrigger value="media">{t("user.media")}</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {postsLoading && posts.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Spinner variant="theme" label={t("loading")} />
              </div>
            )}

            {postsError && (
              <div className="flex items-center justify-center py-12">
                <p className="text-destructive">
                  {t("error.title")}: {postsError.message}
                </p>
              </div>
            )}

            {!postsLoading && !postsError && posts.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t("user.noPosts")}</p>
              </div>
            )}

            {posts.length > 0 && (
              <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
                {postItems.map((item, index) =>
                  item.type === "post" ? (
                    <ProfilePostItem
                      key={item.post.id}
                      post={item.post}
                      onUserClick={(username) =>
                        router.push(`/users/${username}`)
                      }
                      isLast={index === postItems.length - 1}
                      revealHidden={hiddenByViewer}
                    />
                  ) : (
                    <OwnerThreadTimelineItem
                      key={`${item.rootPost.id}:${item.replies.map((reply) => reply.id).join(":")}`}
                      rootPost={item.rootPost}
                      replies={item.replies}
                      isMerged={item.isMerged}
                      onUserClick={(username) =>
                        router.push(`/users/${username}`)
                      }
                      onShowThread={() =>
                        router.push(`/posts/${item.replies[0]?.id ?? item.rootPost.id}?expandAncestors=1`)
                      }
                      isLast={index === postItems.length - 1}
                      skipHiddenCushion={hiddenByViewer}
                    />
                  ),
                )}
              </div>
            )}

            <InfiniteScrollTrigger
              sentinelRef={postsInfiniteScrollRef}
              hasNextPage={Boolean(hasNextPage)}
              isFetchingNextPage={isFetchingNextPage}
            />
          </TabsContent>

          <TabsContent value="replies">
            {repliesLoading && replies.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Spinner variant="theme" label={t("loading")} />
              </div>
            )}

            {repliesError && (
              <div className="flex items-center justify-center py-12">
                <p className="text-destructive">
                  {t("error.title")}: {repliesError.message}
                </p>
              </div>
            )}

            {!repliesLoading && !repliesError && replies.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t("user.noReplies")}</p>
              </div>
            )}

            {replies.length > 0 && (
              <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
                {replyItems.map((item, index) =>
                  item.type === "post" ? (
                    <ProfilePostItem
                      key={item.post.id}
                      post={item.post}
                      onUserClick={(username) =>
                        router.push(`/users/${username}`)
                      }
                      isLast={index === replyItems.length - 1}
                      revealHidden={hiddenByViewer}
                    />
                  ) : (
                    <OwnerThreadTimelineItem
                      key={`${item.rootPost.id}:${item.replies.map((reply) => reply.id).join(":")}`}
                      rootPost={item.rootPost}
                      replies={item.replies}
                      isMerged={item.isMerged}
                      onUserClick={(username) =>
                        router.push(`/users/${username}`)
                      }
                      onShowThread={() =>
                        router.push(`/posts/${item.replies[0]?.id ?? item.rootPost.id}?expandAncestors=1`)
                      }
                      isLast={index === replyItems.length - 1}
                      skipHiddenCushion={hiddenByViewer}
                    />
                  ),
                )}
              </div>
            )}

            <InfiniteScrollTrigger
              sentinelRef={repliesInfiniteScrollRef}
              hasNextPage={Boolean(hasNextRepliesPage)}
              isFetchingNextPage={isFetchingNextRepliesPage}
            />
          </TabsContent>

          <TabsContent value="media">
            {mediaLoading && media.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Spinner variant="theme" label={t("loading")} />
              </div>
            )}

            {mediaError && (
              <div className="flex items-center justify-center py-12">
                <p className="text-destructive">
                  {t("error.title")}: {mediaError.message}
                </p>
              </div>
            )}

            {!mediaLoading && !mediaError && media.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t("user.noMedia")}</p>
              </div>
            )}

            {media.length > 0 && (
              <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
                {media.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onUserClick={(username) => router.push(`/users/${username}`)}
                    isLast={index === media.length - 1}
                    skipHiddenCushion={hiddenByViewer}
                  />
                ))}
              </div>
            )}

            <InfiniteScrollTrigger
              sentinelRef={mediaInfiniteScrollRef}
              hasNextPage={Boolean(hasNextMediaPage)}
              isFetchingNextPage={isFetchingNextMediaPage}
            />
          </TabsContent>
        </Tabs>
        )}
      </div>

      {cropDialogOpen && cropImageSrc && pendingCropFile && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={cropImageSrc}
          aspectMode={{ mode: "fixed", aspect: cropAspect }}
          title={cropTitle}
          originalFile={pendingCropFile}
          onCropComplete={handleCropComplete}
        />
      )}
      {hideDialog}
    </PageContainer>
  );
}
