"use client";

import { useCallback, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReactionBadge } from "@/components/ReactionBadge";
import { ReactionUsersDialog } from "@/components/ReactionUsersDialog";
import { ReactionPicker } from "@/components/ReactionPicker";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
import { useReactions } from "@/lib/hooks/use-reactions";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { Eye, MoreHorizontal, Trash2, Clipboard } from "lucide-react";
import { useDeletePost } from "@/lib/hooks/use-queries";
import { OgpCard } from "@/components/OgpCard";
import { extractFirstUrl } from "@/lib/ogp/extract-url";
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
import { PostMediaPreview } from "@/components/PostMediaPreview";
import type { PreviewMediaItem } from "@/components/post-composer/types";

type Post = components["schemas"]["Post"];

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
  const { reactions, toggleReaction, isPending } = useReactions(post.id);
  const auth = useAtomValue(authAtom);
  const deletePost = useDeletePost();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reactionDialogOpen, setReactionDialogOpen] = useState(false);
  const [reactionDialogEmoji, setReactionDialogEmoji] = useState<string | null>(null);
  const isOwner = auth.user?.id === post.author?.id;
  const hasReactions = reactions.length > 0;

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
  const media = useMemo(() => post.media || [], [post.media]);
  const hasAuthorId = Boolean(post.author?.id);

  // Convert API Media[] to PreviewMediaItem[] for the shared component
  const previewMedia: PreviewMediaItem[] = useMemo(
    () =>
      media.map((m) => ({
        id: m.id,
        type: m.type as "image" | "video",
        url: m.url,
        width: m.width,
        height: m.height,
        thumbnailUrl: m.thumbnailUrl,
      })),
    [media],
  );

  // OGP: Extract the first URL from post content, but only if no media is attached.
  const ogpUrl = useMemo(
    () => (media.length === 0 && post.content ? extractFirstUrl(post.content) : null),
    [media.length, post.content],
  );

  // Generate initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Lightbox images (only non-video media)
  const lightboxImages = useMemo(
    () =>
      media
        .filter((m) => m.type !== "video")
        .map((item) => ({ src: item.url, alt: "" })),
    [media],
  );

  const handleLightboxOpen = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

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
                <MfmRenderer text={displayName} allowList={DISPLAY_NAME_ALLOW_LIST} />
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
            <div className="text-foreground whitespace-pre-wrap break-words mb-3">
              <MfmRenderer text={post.content} />
            </div>
          )}

          {/* OGP Link Preview – only when no media is attached */}
          {ogpUrl && <OgpCard url={ogpUrl} />}

          {/* Media: Images / Video via shared component */}
          <PostMediaPreview
            media={previewMedia}
            onLightboxOpen={handleLightboxOpen}
          />

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
                  postId={post.id}
                  onOpenDialog={(emoji) => {
                    setReactionDialogEmoji(emoji);
                    setReactionDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {hasReactions && (
            <ReactionUsersDialog
              postId={post.id}
              reactions={reactions}
              open={reactionDialogOpen}
              onOpenChange={setReactionDialogOpen}
              initialEmoji={reactionDialogEmoji}
            />
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
                  {hasReactions && (
                    <DropdownMenuItem
                      onSelect={() => {
                        setReactionDialogEmoji(reactions[0]?.emoji ?? null);
                        setReactionDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      {t("actions.viewReactions")}
                    </DropdownMenuItem>
                  )}
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
                    {hasReactions && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          setReactionDialogEmoji(reactions[0]?.emoji ?? null);
                          setReactionDialogOpen(true);
                          setMenuOpen(false);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        {t("actions.viewReactions")}
                      </Button>
                    )}
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
