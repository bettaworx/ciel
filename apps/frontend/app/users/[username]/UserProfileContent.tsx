"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUser,
  useUserPosts,
  useUpdateProfile,
  useUpdateAvatar,
  useUpdateBanner,
  queryKeys,
} from "@/lib/hooks/use-queries";
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
  MoreHorizontal,
  Pencil,
  Share,
  User,
  X,
  Save,
  Upload,
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST, BIO_ALLOW_LIST } from "@/lib/mfm/parse";
import { PostCard } from "@/components/PostCard";
import { Spinner } from "@/components/Spinner";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { toast } from "sonner";

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
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
  } = useUserPosts(username);

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

  const posts = postsData?.pages.flatMap((page) => page.items ?? []) ?? [];

  return (
    <PageContainer maxWidth="2xl">
      <div>
        {/* User Profile Header */}
        <div className="select-none bg-card rounded-2xl overflow-hidden mb-8">
          {/* Banner */}
          <div
            className={`w-full aspect-[3/1] bg-muted relative ${isEditing ? "cursor-pointer" : ""}`}
            onClick={
              isEditing ? () => bannerFileInputRef.current?.click() : undefined
            }
          >
            {(isEditing ? bannerPreview || user.bannerUrl : user.bannerUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  (isEditing
                    ? bannerPreview || user.bannerUrl
                    : user.bannerUrl) ?? undefined
                }
                alt=""
                className="w-full h-full object-cover"
              />
            )}
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
                  className="bg-black/60 text-white hover:bg-black/85 hover:text-white"
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
                      className="bg-black/60 text-white hover:bg-black/85 hover:text-white"
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
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label={t("user.moreActions")}
                      className="bg-black/60 text-white hover:bg-black/85 hover:text-white"
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
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </div>
          </div>

          <div className="px-3">
            {/* Avatar row + action buttons */}
            <div className="flex items-start h-12 sm:h-16 mb-3">
              <div className="relative shrink-0 ml-1">
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
                    className="absolute bottom-1 right-1 sm:hidden bg-black/60 text-white hover:bg-black/85 hover:text-white"
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

                {/* Right: pencil / cancel + save */}
                <div className="flex items-center gap-2">
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
            <div className="select-text flex flex-col gap-3">
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
                    <MfmRenderer
                      text={user.displayName || user.username}
                      allowList={DISPLAY_NAME_ALLOW_LIST}
                    />
                  </h1>
                )}
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>

              <div className="pb-3">
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
                    {user.bio && (
                      <div className="text-sm text-foreground leading-relaxed">
                        <MfmRenderer
                          text={user.bio}
                          allowList={BIO_ALLOW_LIST}
                        />
                      </div>
                    )}
                    {!user.bio && (
                      <p className="text-muted-foreground italic">
                        {t("user.noBio")}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-foreground">
            {t("user.posts")}
          </h2>
        </div>

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
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                onUserClick={(username) => router.push(`/users/${username}`)}
                isLast={index === posts.length - 1}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => fetchNextPage()}
              className="transition-colors duration-160 ease"
            >
              {t("timeline.loadMore")}
            </Button>
          </div>
        )}
      </div>

      {cropDialogOpen && cropImageSrc && pendingCropFile && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={cropImageSrc}
          aspect={cropAspect}
          title={cropTitle}
          originalFile={pendingCropFile}
          onCropComplete={handleCropComplete}
        />
      )}
    </PageContainer>
  );
}
