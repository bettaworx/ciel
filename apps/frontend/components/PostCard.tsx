"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ReactionBadge } from "@/components/ReactionBadge";
import { ReactionUsersDialog } from "@/components/ReactionUsersDialog";
import { ReactionPicker } from "@/components/ReactionPicker";
import { CreateReplyDialog } from "@/components/CreateReplyDialog";
import { formatFullTimestamp, formatTimeAgo } from "@/lib/utils/format-time";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
import { useReactions } from "@/lib/hooks/use-reactions";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import {
  ChevronRight,
  Copy,
  Eye,
  FileText,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Share,
  Trash2,
  User,
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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

/**
 * Controls the rendering of vertical thread connector lines that hug the
 * avatar's horizontal center.
 *
 * - "above": line spans from the article top edge down to the avatar's top
 * - "below": line spans from the avatar's bottom down to the article bottom
 *   (NOT supported with `variant="detail"` — silently omitted there)
 * - "both": both of the above
 * - "none" (default): no line is rendered
 */
export type PostCardThreadLine = "none" | "above" | "below" | "both";

// Vertical thread connector line, absolutely positioned within a PostCard
// article. Positions assume the surrounding article has p-3 padding and the
// avatar wrapper is h-10 / sm:h-12. A 4px (Tailwind unit 1) gap separates
// the line ends from the avatar.
function ThreadConnectorLine({
  anchor = "avatar",
  position,
  variant = "solid",
}: {
  anchor?: "avatar" | "center";
  position: "above" | "below";
  variant?: "solid" | "dashed";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute left-8 sm:left-9 -translate-x-1/2",
        variant === "solid"
          ? "w-0.5 bg-border"
          : "w-0 border-l border-dashed border-border",
        anchor === "avatar" &&
          (position === "above"
            ? "top-0 h-2"
            : "top-14 sm:top-16 bottom-0"),
        anchor === "center" &&
          (position === "above" ? "top-0 bottom-1/2" : "top-1/2 bottom-0"),
      )}
    />
  );
}

export interface PostCardProps {
  post: Post;
  onUserClick?: (username: string) => void;
  onDeleteSuccess?: () => void;
  className?: string;
  isLast?: boolean;
  variant?: PostCardVariant;
  threadLine?: PostCardThreadLine;
}

export interface PostTreeActionButtonProps {
  children: ReactNode;
  onClick?: ButtonProps["onClick"];
  className?: string;
  isLast?: boolean;
  threadLine?: PostCardThreadLine;
  buttonProps?: Omit<ButtonProps, "children" | "onClick">;
}

export function PostTreeActionButton({
  children,
  onClick,
  className,
  isLast = false,
  threadLine = "none",
  buttonProps,
}: PostTreeActionButtonProps) {
  const showAboveLine = threadLine === "above" || threadLine === "both";
  const showBelowLine = threadLine === "below" || threadLine === "both";
  const showThreadDot = showAboveLine || showBelowLine;
  const {
    className: buttonClassName,
    variant,
    size,
    ...restButtonProps
  } = buttonProps ?? {};
  return (
    <article
      className={cn(
        "relative px-3 text-card-foreground transition-colors",
        showAboveLine ? "pt-0" : "pt-3",
        showBelowLine ? "pb-0" : "pb-3",
        !isLast && !showBelowLine && "border-b border-border",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex h-6 w-10 shrink-0 items-center justify-center sm:w-12"
        >
          {showThreadDot && (
            <span className="flex flex-col gap-0.5">
              <span className="h-0.5 w-0.5 bg-border" />
              <span className="h-0.5 w-0.5 bg-border" />
              <span className="h-0.5 w-0.5 bg-border" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Button
            {...restButtonProps}
            variant={variant ?? "link"}
            size={size ?? "sm"}
            className={cn(
              "h-6 max-w-full justify-start overflow-hidden px-2 py-0 text-sm leading-none text-muted-foreground",
              buttonClassName,
            )}
            onClick={onClick}
          >
            {children}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PostCard({
  post,
  onUserClick,
  onDeleteSuccess,
  className,
  isLast = false,
  variant = "timeline",
  threadLine = "none",
}: PostCardProps) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("postCard");
  const tCreatePost = useTranslations("createPost");
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
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [reactionDialogEmoji, setReactionDialogEmoji] = useState<string | null>(
    null,
  );
  const [shiftHeld, setShiftHeld] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const [isCompactOverflowing, setIsCompactOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const isOwner = auth.user?.id === post.author?.id;
  const hasReactions = reactions.length > 0;
  const displayConfig = getPostCardDisplayConfig(variant);
  const {
    linkToDetail,
    collapseContent,
    timestampFormat,
    timestampPlacement,
    showReactions,
  } = displayConfig;
  const verticalIdentity = displayConfig.identityLayout === "vertical";
  const isCompact = variant === "compact";

  const showAboveLine = threadLine === "above" || threadLine === "both";
  const wantsBelowLine = threadLine === "below" || threadLine === "both";
  // The below-line cannot be used in the detail layout: in that layout the
  // content extends to the full card width below the avatar, so a vertical
  // line passing through the content area would be visually misleading.
  const showBelowLine = wantsBelowLine && !verticalIdentity;

  if (
    process.env.NODE_ENV !== "production" &&
    wantsBelowLine &&
    verticalIdentity
  ) {
    console.warn(
      'PostCard: threadLine "below"/"both" is not supported with variant="detail" — the line below the avatar will be omitted.',
    );
  }

  useEffect(() => {
    if (!collapseContent) {
      setIsContentOverflowing(false);
      return;
    }

    const el = contentRef.current;
    if (!el) return;
    setIsContentOverflowing(el.scrollHeight > POST_CONTENT_COLLAPSE_HEIGHT);
  }, [collapseContent, post.content]);

  useEffect(() => {
    if (!isCompact) {
      setIsCompactOverflowing(false);
      return;
    }
    const el = articleRef.current;
    if (!el) return;
    const measure = () => {
      setIsCompactOverflowing(el.scrollHeight > el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isCompact, post.content, post.media?.length]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => e.key === "Shift" && setShiftHeld(true);
    const up = (e: KeyboardEvent) => e.key === "Shift" && setShiftHeld(false);
    const blur = () => setShiftHeld(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

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

  const handleCopyPostId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(post.id);
      toast.success(t("copyPostIdSuccess"));
    } catch {
      toast.error(t("copyPostIdError"));
    }
    setMenuOpen(false);
  }, [post.id, t]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    if (e.shiftKey) {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success(t("actions.shareSuccess"));
      } catch {
        toast.error(t("actions.shareError"));
      }
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.author?.displayName || (post.author?.username ? `@${post.author.username}` : undefined),
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        toast.success(t("actions.shareSuccess"));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error(t("actions.shareError"));
    }
  }, [post.id, post.author?.displayName, post.author?.username, t]);

  const handleOpenDelete = useCallback(() => {
    setMenuOpen(false);
    setConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        toast.success(t("deleteSuccess"));
        setConfirmOpen(false);
        onDeleteSuccess?.();
      },
      onError: () => {
        toast.error(t("deleteError"));
      },
    });
  }, [deletePost, onDeleteSuccess, post.id, t]);

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
          ? "flex max-w-full min-w-0 flex-1 flex-col justify-center"
          : "flex max-w-full min-w-0 items-center gap-1.5 overflow-hidden",
      )}
    >
      <button
        onClick={handleUserClick}
        title={displayName}
        className={cn(
          "block max-w-full min-w-0 truncate overflow-hidden whitespace-nowrap text-left font-semibold text-foreground hover:underline focus:underline focus:outline-none",
          "text-sm sm:text-base",
          verticalIdentity && "leading-tight",
        )}
      >
        <MfmRenderer
          text={displayName}
          allowList={DISPLAY_NAME_ALLOW_LIST}
          className="block max-w-full min-w-0 truncate overflow-hidden whitespace-nowrap [&_*]:max-w-full"
        />
      </button>
      {hasDisplayName && (
        <span
          title={`@${username}`}
          className={cn(
            "block max-w-full min-w-0 truncate overflow-hidden whitespace-nowrap text-muted-foreground text-sm sm:text-base",
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
      className="ml-auto h-auto p-0 text-xs font-normal text-muted-foreground shrink-0"
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

  const moreMenuNode = isDesktop ? (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-my-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease"
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Copy className="h-4 w-4" />
            {t("actions.copy")}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {post.content && (
                <DropdownMenuItem onSelect={handleCopyText}>
                  <FileText className="h-4 w-4" />
                  {t("actions.copyText")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={handleCopyUserId}
                disabled={!hasAuthorId}
              >
                <User className="h-4 w-4" />
                {t("actions.copyUserId")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleCopyPostId}>
                <MessageCircle className="h-4 w-4" />
                {t("actions.copyPostId")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
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
          className="-my-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease"
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
          <Drawer nested>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Copy className="h-4 w-4" />
                {t("actions.copy")}
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="flex flex-col gap-2 p-2 pb-4">
                {post.content && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={handleCopyText}
                  >
                    <FileText className="h-4 w-4" />
                    {t("actions.copyText")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleCopyUserId}
                  disabled={!hasAuthorId}
                >
                  <User className="h-4 w-4" />
                  {t("actions.copyUserId")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleCopyPostId}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("actions.copyPostId")}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
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
          verticalIdentity && "mt-3 mb-1 sm:mb-1.5",
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
          <MfmRenderer text={post.content} skipLeadingMention={!!post.parentId} />
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

      {/* Reaction Badges */}
      {hasReactions && (
        <div
          className={cn(
            "flex items-center flex-wrap gap-1.5",
            verticalIdentity && "mt-1 sm:mt-1.5 ",
            (hasReactions) && "mb-2 sm:mb-3",
          )}
        >
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

      {/* Action Area */}
      <div className={cn("flex items-center justify-between")}>
        <div className="flex items-center gap-1.5">
          <ReactionPicker
            onEmojiSelect={handleToggleReaction}
            disabled={isPending}
          />
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 text-muted-foreground transition-colors duration-160 ease hover:text-foreground",
              post.replyCount > 0 ? "px-2 gap-1" : "w-8 p-0",
            )}
            aria-label={tCreatePost("replyTitle")}
            onClick={() => setReplyDialogOpen(true)}
          >
            <MessageCircle className="h-5 w-5" />
            {post.replyCount > 0 && (
              <span className="text-xs tabular-nums">{post.replyCount}</span>
            )}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground transition-colors duration-160 ease hover:text-foreground"
          aria-label={shiftHeld ? t("actions.copyLink") : t("actions.share")}
          onClick={handleShare}
        >
          {shiftHeld ? <Link2 className="h-5 w-5" /> : <Share className="h-5 w-5" />}
        </Button>
      </div>

      <CreateReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        parentId={post.id}
        contentPrefix={post.author?.username ? `@${post.author.username} ` : undefined}
      />
    </>
  );

  return (
    <article
      ref={articleRef}
      className={cn(
        "relative text-card-foreground p-3 transition-colors",
        !isLast && !showBelowLine && "border-b border-border",
        isCompact && "max-h-48 overflow-hidden",
        className,
      )}
    >
      {showAboveLine && <ThreadConnectorLine position="above" />}
      {showBelowLine && <ThreadConnectorLine position="below" />}

      {verticalIdentity ? (
        <>
          {/* Identity row with avatar embedded — full width, no avatar indent below */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex max-w-full min-w-0 flex-1 items-center gap-3">
              {avatarNode}
              {identityStackNode}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {timestampPlacement === "header" && timestampNode}
              {moreMenuNode}
            </div>
          </div>
          {bodyNode}
          {mediaNode}
          {timestampPlacement === "afterContent" && standaloneTimestampNode}
          {showReactions && reactionsRowNode}
        </>
      ) : (
        <div className="flex items-start gap-3">
          {avatarNode}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mb-1 sm:mb-1.5">
              <div className="flex min-w-0 items-center gap-2">
                {identityStackNode}
                {timestampPlacement === "header" && timestampNode}
                {moreMenuNode}
              </div>
              {bodyNode}
            </div>
            {mediaNode}
            {timestampPlacement === "afterContent" && standaloneTimestampNode}
            {showReactions && reactionsRowNode}
          </div>
        </div>
      )}
      {isCompact && isCompactOverflowing && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-16 right-0 h-16 bg-gradient-to-t from-card to-transparent sm:left-[4.5rem]"
        />
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
