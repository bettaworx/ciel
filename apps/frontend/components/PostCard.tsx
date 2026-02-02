"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReactionBadge } from "@/components/ReactionBadge";
import { ReactionPicker } from "@/components/ReactionPicker";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { useReactions } from "@/lib/hooks/use-reactions";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { MoreHorizontal, Trash2, Clipboard } from "lucide-react";
import { useDeletePost } from "@/lib/hooks/use-queries";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { authAtom } from "@/atoms/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { components } from "@/lib/api/api";
import { ImageLightbox } from "@/components/ImageLightbox";

type Post = components["schemas"]["Post"];
type Media = components["schemas"]["Media"];

export interface PostCardProps {
  post: Post;
  onUserClick?: (username: string) => void;
  className?: string;
  isLast?: boolean;
}

export function PostCard({
  post,
  onUserClick,
  className,
  isLast = false,
}: PostCardProps) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("postCard");
  const tReactions = useTranslations("reactions");
  const tUser = useTranslations("user");
  const tLightbox = useTranslations("lightbox");
  const { reactions, toggleReaction, isPending } = useReactions(post.id);
  const auth = useAtomValue(authAtom);
  const deletePost = useDeletePost();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const isOwner = auth.user?.id === post.author?.id;

  const handleToggleReaction = useCallback(
    (emoji: string) => {
      toggleReaction(emoji, {
        onError: (error) => {
          const errorMessage =
            error.message === "loginRequired"
              ? tReactions("loginRequired")
              : tReactions("error");
          toast.error(errorMessage);
        },
      });
    },
    [toggleReaction, tReactions]
  );

  const handleCopyUserId = useCallback(async () => {
    if (!post.author?.id) {
      toast.error(t("copyError"));
      return;
    }
    try {
      await navigator.clipboard.writeText(post.author.id);
      toast.success(t("copySuccess"));
    } catch {
      toast.error(t("copyError"));
    }
    setMenuOpen(false);
  }, [post.author?.id, t]);

  const handleOpenDelete = useCallback(() => {
    setMenuOpen(false);
    setConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        toast.success(t("deleteSuccess"));
        setConfirmOpen(false);
      },
      onError: () => {
        toast.error(t("deleteError"));
      },
    });
  }, [deletePost, post.id, t]);

  const handleUserClick = () => {
    if (onUserClick && post.author?.username) {
      onUserClick(post.author.username);
    }
  };

  const displayName =
    post.author?.displayName || post.author?.username || tUser("unknown");
  const username = post.author?.username || tUser("unknownUsername");
  const hasDisplayName = Boolean(post.author?.displayName);
  const avatarUrl = post.author?.avatarUrl;
  const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
  const timeAgo = formatTimeAgo(createdAt, locale);
  const media = post.media || [];
  const hasAuthorId = Boolean(post.author?.id);

  // Generate initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const lightboxImages = useMemo(
    () => media.map((item) => ({ src: item.url, alt: "" })),
    [media],
  );

  // Calculate aspect ratio for single image with constraints (16:9 to 9:16)
  const calculateSingleImageAspect = (m: Media): string => {
    const ratio = m.width / m.height;
    const maxRatio = 16 / 9; // 1.778
    const minRatio = 9 / 16; // 0.5625

    if (ratio >= maxRatio) return "16 / 9";
    if (ratio <= minRatio) return "9 / 16";
    return `${m.width} / ${m.height}`;
  };

  return (
    <article
      className={cn(
        "text-card-foreground p-3 transition-colors",
        !isLast && "border-b border-border",
        className,
      )}
    >
      {/* Header: Avatar + Timestamp */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 hover:bg-transparent"
          onClick={handleUserClick}
          aria-label={t("viewProfile", { name: displayName })}
        >
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>

        {/* Content: User Info + Post text + Media */}
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex justify-between items-center gap-2 flex-wrap mb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleUserClick}
                className="font-semibold text-sm sm:text-base text-foreground hover:underline focus:underline focus:outline-none truncate"
              >
                {displayName}
              </button>
              {hasDisplayName && (
                <span className="text-muted-foreground text-xs sm:text-sm truncate">
                  @{username}
                </span>
              )}
            </div>
            <span
              className="text-muted-foreground text-xs"
              aria-label={createdAt.toLocaleString(locale)}
            >
              {timeAgo}
            </span>
          </div>

          {/* Post Content */}
          {post.content && (
            <p className="text-foreground whitespace-pre-wrap break-words mb-3">
              {post.content}
            </p>
          )}

          {/* Media Images */}
          {media.length > 0 && (
            <>
              {/* 1 image: Dynamic aspect ratio with constraints */}
              {media.length === 1 && (
                <div className="mb-3">
                  <div
                    className="relative bg-muted overflow-hidden rounded-xl"
                    style={{
                      // Use CSS variable for dynamic aspect ratio - CSP compliant
                      ['--aspect-ratio' as string]: calculateSingleImageAspect(media[0]),
                      aspectRatio: 'var(--aspect-ratio)',
                    }}
                  >
                    <Image
                      src={media[0].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover cursor-zoom-in"
                      sizes="(max-width: 600px) 100vw, 600px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                </div>
              )}

              {/* 2 images: 8:9 aspect ratio, side by side */}
              {media.length === 2 && (
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div className="relative bg-muted aspect-[8/9] overflow-hidden">
                    <Image
                      src={media[0].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-l-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                  <div className="relative bg-muted aspect-[8/9] overflow-hidden">
                    <Image
                      src={media[1].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-r-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(1);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                </div>
              )}

              {/* 3 images: Left auto-height, Right top/bottom 16:9 */}
              {media.length === 3 && (
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div className="relative bg-muted row-span-2 overflow-hidden">
                    <Image
                      src={media[0].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-l-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={media[1].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-tr-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(1);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={media[2].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-br-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(2);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                </div>
              )}

              {/* 4 images: 2x2 grid, all 16:9 */}
              {media.length === 4 && (
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={media[0].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-tl-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={media[1].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-tr-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(1);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={media[2].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-bl-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(2);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={media[3].url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-br-xl cursor-zoom-in"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxIndex(3);
                        setLightboxOpen(true);
                      }}
                      className="absolute inset-0"
                      aria-label={tLightbox("open")}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {reactions.map((reaction) => (
                <ReactionBadge
                  key={reaction.emoji}
                  emoji={reaction.emoji}
                  count={reaction.count}
                  isReacted={reaction.isReacted}
                  onToggle={() => handleToggleReaction(reaction.emoji)}
                  disabled={isPending}
                />
              ))}
            </div>
          )}

          {/* Reaction Picker */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <ReactionPicker
              onEmojiSelect={handleToggleReaction}
              disabled={isPending}
            />
            {isDesktop ? (
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease"
                    aria-label={t("actions.more")}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={handleCopyUserId}
                    disabled={!hasAuthorId}
                  >
                    <Clipboard className="h-4 w-4" />
                    {t("actions.copyUserId")}
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem
                      onSelect={handleOpenDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease"
                    aria-label={t("actions.more")}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="flex flex-col gap-2 p-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={handleCopyUserId}
                      disabled={!hasAuthorId}
                    >
                      <Clipboard className="h-4 w-4" />
                      {t("actions.copyUserId")}
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive"
                        onClick={handleOpenDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("actions.delete")}
                      </Button>
                    )}
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        </div>
      </div>
      <ImageLightbox
        images={lightboxImages}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>
              {t("deleteCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletePost.isPending}
              variant="destructive"
            >
              {deletePost.isPending ? t("deleteDeleting") : t("deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
