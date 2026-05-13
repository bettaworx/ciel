"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReactionBadge } from "@/components/ReactionBadge";
import { ReactionUsersDialog } from "@/components/ReactionUsersDialog";
import { ReactionPicker } from "@/components/ReactionPicker";
import { formatFullTimestamp, formatTimeAgo } from "@/lib/utils/format-time";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
import { useReactions } from "@/lib/hooks/use-reactions";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import {
  Eye,
  MoreHorizontal,
  Trash2,
  Clipboard,
  ClipboardCopy,
} from "lucide-react";
import { useDeletePost } from "@/lib/hooks/use-queries";
import { OgpCard } from "@/components/OgpCard";
import { extractFirstUrl } from "@/lib/ogp/extract-url";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { authAtom } from "@/atoms/auth";
import {
  POST_CONTENT_COLLAPSE_HEIGHT,
  shouldCollapsePostContent,
  shouldShowPostContentToggle,
} from "@/lib/post-content";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
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
import {
  getPostCardDisplayConfig,
  type PostCardVariant,
} from "@/components/post-card-display";

type Post = components["schemas"]["Post"];

export interface PostCardProps {
  post: Post;
  onUserClick?: (username: string) => void;
  className?: string;
  isLast?: boolean;
  variant?: PostCardVariant;
}

export function PostCard({
  post,
  onUserClick,
  className,
  isLast = false,
  variant = "timeline",
}: PostCardProps) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("postCard");
  const tReactions = useTranslations("reactions");
  const tUser = useTranslations("user");
  const { reactions, toggleReaction, isPending } = useReactions(
    post.id,
    post.reactions,
  );
  const auth = useAtomValue(authAtom);
  const deletePost = useDeletePost();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reactionDialogOpen, setReactionDialogOpen] = useState(false);
  const [reactionDialogEmoji, setReactionDialogEmoji] = useState<string | null>(
    null,
  );
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const isOwner = auth.user?.id === post.author?.id;
  const hasReactions = reactions.length > 0;
  const displayConfig = getPostCardDisplayConfig(variant);
  const {
    linkToDetail,
    collapseContent,
    timestampFormat,
    timestampPlacement,
  } = displayConfig;
  const verticalIdentity = displayConfig.identityLayout === "vertical";

  useEffect(() => {
    if (!collapseContent) {
      setIsContentOverflowing(false);
      return;
    }

    const el = contentRef.current;
    if (!el) return;
    setIsContentOverflowing(el.scrollHeight > POST_CONTENT_COLLAPSE_HEIGHT);
  }, [collapseContent, post.content]);

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
    [toggleReaction, tReactions],
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

  const handleCopyText = useCallback(async () => {
    if (!post.content) {
      toast.error(t("copyTextError"));
      return;
    }
    try {
      await navigator.clipboard.writeText(post.content);
      toast.success(t("copyTextSuccess"));
    } catch {
      toast.error(t("copyTextError"));
    }
    setMenuOpen(false);
  }, [post.content, t]);

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

  const handleUserClick = useCallback(() => {
    if (onUserClick && post.author?.username) {
      onUserClick(post.author.username);
    }
  }, [onUserClick, post.author?.username]);

  const detailHref = `/posts/${post.id}`;

  const displayName =
    post.author?.displayName ||
    (post.author?.username ? `@${post.author.username}` : tUser("unknown"));
  const username = post.author?.username || tUser("unknownUsername");
  const hasDisplayName = Boolean(post.author?.displayName);
  const avatarUrl = post.author?.avatarUrl;
  const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
  const fullTimestamp = formatFullTimestamp(createdAt, locale);
  const timestampText =
    timestampFormat === "full"
      ? fullTimestamp
      : formatTimeAgo(createdAt, locale);
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
        blurhash: m.blurhash,
      })),
    [media],
  );

  // OGP: Extract the first URL from post content, but only if no media is attached.
  const ogpUrl = useMemo(
    () =>
      media.length === 0 && post.content ? extractFirstUrl(post.content) : null,
    [media.length, post.content],
  );
  const shouldCollapseContent = shouldCollapsePostContent({
    collapseContent,
    isExpanded: isContentExpanded,
    isOverflowing: isContentOverflowing,
  });
  const shouldShowContentToggle = shouldShowPostContentToggle(
    collapseContent,
    isContentOverflowing,
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

  const avatarNode = (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 hover:bg-transparent shrink-0"
      onClick={handleUserClick}
      aria-label={t("viewProfile", { name: displayName })}
    >
      <Avatar className="h-11 w-11 sm:h-12 sm:w-12">
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Button>
  );

  const identityStackNode = (
    <div
      className={cn(
        verticalIdentity
          ? "flex flex-col justify-center min-w-0"
          : "flex items-center gap-1.5 min-w-0",
      )}
    >
      <button
        onClick={handleUserClick}
        className={cn(
          "font-semibold text-foreground hover:underline focus:underline focus:outline-none truncate",
          "text-sm sm:text-base",
          verticalIdentity && "leading-tight",
        )}
      >
        <MfmRenderer
          text={displayName}
          allowList={DISPLAY_NAME_ALLOW_LIST}
        />
      </button>
      {hasDisplayName && (
        <span
          className={cn(
            "text-muted-foreground text-sm sm:text-base truncate",
            verticalIdentity && "leading-tight",
          )}
        >
          @{username}
        </span>
      )}
    </div>
  );

  const timestampNode = linkToDetail ? (
    <Button
      asChild
      variant="link"
      size="sm"
      rounded="none"
      className="h-auto p-0 text-xs font-normal text-muted-foreground shrink-0"
    >
      <Link
        href={detailHref}
        aria-label={fullTimestamp}
      >
        {timestampText}
      </Link>
    </Button>
  ) : (
    <span
      className="text-muted-foreground text-xs shrink-0"
      aria-label={fullTimestamp}
    >
      {timestampText}
    </span>
  );

  const standaloneTimestampNode = (
    <div className="mb-2 text-left">
      <span
        className="text-muted-foreground text-xs"
        aria-label={fullTimestamp}
      >
        {timestampText}
      </span>
    </div>
  );

  const bodyNode = post.content && (
    <>
      <div
        className={cn(
          "relative",
          verticalIdentity && "mt-2 sm:mt-3 mb-1 sm:mb-1.5",
        )}
      >
        {linkToDetail && (
          <Link
            href={detailHref}
            aria-label={t("openDetail")}
            tabIndex={-1}
            className="absolute inset-0 z-0"
          />
        )}
        <div
          ref={contentRef}
          className={cn(
            "relative text-foreground whitespace-pre-wrap break-words text-sm sm:text-base",
            linkToDetail &&
              'select-none pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_.mfm-blur]:pointer-events-auto [&_[role="button"]]:pointer-events-auto',
            shouldCollapseContent &&
              "max-h-32 overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]",
          )}
        >
          <MfmRenderer text={post.content} />
        </div>
      </div>
      {shouldShowContentToggle && (
        <div className="flex justify-start mt-1">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-muted-foreground"
            onClick={() => setIsContentExpanded((v) => !v)}
          >
            {isContentExpanded ? t("showLess") : t("showMore")}
          </Button>
        </div>
      )}
    </>
  );

  const mediaNode = (ogpUrl || previewMedia.length > 0) && (
    <div
      className={cn(
        verticalIdentity ? "mt-3 mb-1 sm:mb-1.5" : "mb-2 sm:mb-3",
      )}
    >
      {/* OGP Link Preview – only when no media is attached */}
      {ogpUrl && <OgpCard url={ogpUrl} />}

      {/* Media: Images / Video via shared component */}
      <PostMediaPreview
        media={previewMedia}
        onLightboxOpen={handleLightboxOpen}
      />
    </div>
  );

  const reactionsRowNode = (
    <>
      {hasReactions && (
        <ReactionUsersDialog
          postId={post.id}
          reactions={reactions}
          open={reactionDialogOpen}
          onOpenChange={setReactionDialogOpen}
          initialEmoji={reactionDialogEmoji}
        />
      )}

      {/* Reactions + Reaction Picker */}
      <div
        className={cn(
          "flex items-end justify-between gap-2",
          verticalIdentity && "mt-1 sm:mt-1.5",
        )}
      >
        <div className="flex items-center flex-wrap gap-1.5">
          {hasReactions &&
            reactions.map((reaction) => (
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
          <ReactionPicker
            onEmojiSelect={handleToggleReaction}
            disabled={isPending}
          />
        </div>
        <div className="shrink-0">
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
                {post.content && (
                  <DropdownMenuItem onSelect={handleCopyText}>
                    <ClipboardCopy className="h-4 w-4" />
                    {t("actions.copyText")}
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
                <div className="flex flex-col gap-2 p-2 pb-4">
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
                  {post.content && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={handleCopyText}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                      {t("actions.copyText")}
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
    </>
  );

  return (
    <article
      className={cn(
        "text-card-foreground p-3 transition-colors",
        !isLast && "border-b border-border",
        className,
      )}
    >
      {verticalIdentity ? (
        <>
          {/* Identity row with avatar embedded — full width, no avatar indent below */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {avatarNode}
              {identityStackNode}
            </div>
            {timestampPlacement === "header" && timestampNode}
          </div>
          {bodyNode}
          {mediaNode}
          {timestampPlacement === "afterContent" && standaloneTimestampNode}
          {reactionsRowNode}
        </>
      ) : (
        <div className="flex items-start gap-3">
          {avatarNode}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mb-1 sm:mb-1.5">
              <div className="flex justify-between items-center flex-wrap gap-2">
                {identityStackNode}
                {timestampPlacement === "header" && timestampNode}
              </div>
              {bodyNode}
            </div>
            {mediaNode}
            {timestampPlacement === "afterContent" && standaloneTimestampNode}
            {reactionsRowNode}
          </div>
        </div>
      )}
      <ImageLightbox
        images={lightboxImages}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
      {isDesktop ? (
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
                {deletePost.isPending
                  ? t("deleteDeleting")
                  : t("deleteConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t("deleteConfirmTitle")}</DrawerTitle>
              <DrawerDescription>
                {t("deleteConfirmDescription")}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletePost.isPending}
              >
                {deletePost.isPending
                  ? t("deleteDeleting")
                  : t("deleteConfirm")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={deletePost.isPending}
              >
                {t("deleteCancel")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </article>
  );
}
