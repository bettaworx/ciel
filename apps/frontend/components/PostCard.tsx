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
import { CreateQuoteDialog } from "@/components/CreateQuoteDialog";
import { formatFullTimestamp, formatTimeAgo } from "@/lib/utils/format-time";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DisplayName } from "@/components/users/DisplayName";
import { HiddenPostCard } from "@/components/HiddenPostCard";
import { postCushion } from "@/lib/moderation/visibility";
import { useHideUserActions } from "@/lib/hooks/use-hide-user-actions";
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
  Quote,
  Ban,
  Rocket,
  MoreHorizontal,
  RotateCcw,
  Share,
  Trash2,
  User,
} from "lucide-react";
import { useDeletePost, queryKeys } from "@/lib/hooks/use-queries";
import { useApi } from "@/lib/api/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { OgpCard } from "@/components/OgpCard";
import { BookmarkButton } from "@/components/BookmarkButton";
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
import { DeletedPostCard } from "@/components/DeletedPostCard";
import { Lightbox } from "@/components/Lightbox";
import { PostMediaPreview } from "@/components/PostMediaPreview";
import type { PreviewMediaItem } from "@/components/post-composer/types";
import {
  getPostCardDisplayConfig,
  type PostCardVariant,
} from "@/components/post-card-display";
import {
  PostCardIndicatorRow,
  type PostCardIndicator,
} from "@/components/PostCardIndicatorRow";

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
export function ThreadConnectorLine({
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

export type { PostCardIndicator } from "@/components/PostCardIndicatorRow";

export interface PostCardProps {
  post: Post;
  onUserClick?: (username: string) => void;
  onDeleteSuccess?: () => void;
  className?: string;
  isLast?: boolean;
  variant?: PostCardVariant;
  threadLine?: PostCardThreadLine;
  indicator?: PostCardIndicator;
  /**
   * Badged onto the author's avatar. Notifications use it to mark the kind of
   * notification without spending a whole row on an indicator.
   */
  avatarBadge?: ReactNode;
  /**
   * Skips the muted/blocked cushion for this card. Set by surfaces that already
   * asked once — the profile of a muted account gates its whole post list behind
   * a single banner, and cushioning every row underneath it would mean answering
   * the same question twice.
   */
  skipHiddenCushion?: boolean;
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
  indicator,
  avatarBadge,
  skipHiddenCushion = false,
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
  const api = useApi();
  const queryClient = useQueryClient();
  const deletePost = useDeletePost();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const [boostMenuOpen, setBoostMenuOpen] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reactionDialogOpen, setReactionDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [reactionDialogEmoji, setReactionDialogEmoji] = useState<string | null>(
    null,
  );
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);
  const [shiftHeld, setShiftHeld] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [revealHidden, setRevealHidden] = useState(false);
  const { actions: hideActions, dialog: hideDialog } = useHideUserActions(
    post.author?.username,
    { isMuted: post.author?.isMuted, isBlocking: post.author?.isBlocking },
  );
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const [isCompactOverflowing, setIsCompactOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const isOwner = auth.user?.id === post.author?.id;
  const canUndoBoost = indicator?.actorUserId != null && indicator.actorUserId === auth.user?.id;
  // Boosting and quoting a private account's post is refused by the server for
  // everyone, including its accepted followers. The button is blocked rather
  // than hidden so the reason is visible instead of the control just vanishing.
  const boostBlocked = Boolean(post.author?.isPrivate);
  const hiddenKind = postCushion(post, {
    skip: skipHiddenCushion,
    revealed: revealHidden,
  });
  const hasReactions = reactions.length > 0;
  const displayConfig = getPostCardDisplayConfig(variant);
  const {
    linkToDetail,
    collapseContent,
    timestampFormat,
    timestampPlacement,
    showReactions,
    showMoreMenu,
  } = displayConfig;
  const verticalIdentity = displayConfig.identityLayout === "vertical";
  const isCompact = variant === "compact";
  const isEmbedded = variant === "embedded";

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

  const media = useMemo(() => post.media || [], [post.media]);

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
      media.length === 0 && post.content && !post.referenceId
        ? extractFirstUrl(post.content)
        : null,
    [media.length, post.content, post.referenceId],
  );

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
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!canNativeShare) return;
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
  }, [canNativeShare]);

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

  const handleCopyBoostPostId = useCallback(async () => {
    if (!indicator?.sourcePostId) return;
    try {
      await navigator.clipboard.writeText(indicator.sourcePostId);
      toast.success(t("copyPostIdSuccess"));
    } catch {
      toast.error(t("copyPostIdError"));
    }
    setIndicatorMenuOpen(false);
  }, [indicator?.sourcePostId, t]);

  const handleCopyBoostUserId = useCallback(async () => {
    if (!indicator?.actorUserId) return;
    try {
      await navigator.clipboard.writeText(indicator.actorUserId);
      toast.success(t("copySuccess"));
    } catch {
      toast.error(t("copyError"));
    }
    setIndicatorMenuOpen(false);
  }, [indicator?.actorUserId, t]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    if (canNativeShare && e.shiftKey) {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast.success(t("actions.shareSuccess"));
      } catch {
        toast.error(t("actions.shareError"));
      }
      return;
    }
    try {
      if (canNativeShare) {
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
  }, [post.id, post.author?.displayName, post.author?.username, t, canNativeShare]);

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

  const handleBoost = useCallback(async () => {
    if (!auth.user) {
      toast.error(t("actions.boostError"));
      return;
    }
    if (isBoosting) return;
    setIsBoosting(true);
    try {
      const result = await api.createPost({ referenceId: post.id });
      if (!result.ok) {
        if (result.status === 409) {
          toast.info(t("actions.alreadyBoosted"));
        } else {
          toast.error(t("actions.boostError"));
        }
        return;
      }
      toast.success(t("actions.boostSuccess"));
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline });
      queryClient.invalidateQueries({ queryKey: queryKeys.post(post.id) });
    } catch {
      toast.error(t("actions.boostError"));
    } finally {
      setIsBoosting(false);
    }
  }, [auth.user, isBoosting, api, post.id, t, queryClient]);

  const handleUndoBoost = useCallback(async () => {
    if (!indicator?.sourcePostId) return;
    setIndicatorMenuOpen(false);
    try {
      await deletePost.mutateAsync(indicator.sourcePostId);
      toast.success(t("actions.undoBoostSuccess"));
    } catch {
      toast.error(t("actions.undoBoostError"));
    }
  }, [indicator?.sourcePostId, deletePost, t]);

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
  const hasAuthorId = Boolean(post.author?.id);
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

  // Lightbox items (only non-video media for now)
  const lightboxItems = useMemo(
    () =>
      media
        .filter((m) => m.type !== "video")
        .map((item) => ({
          type: item.type as "image" | "video",
          url: item.url,
          width: item.width,
          height: item.height,
          blurhash: item.blurhash,
        })),
    [media],
  );

  /** The media wrapper that was clicked; the lightbox morphs out of it. */
  const lightboxSourceRef = useRef<HTMLElement | null>(null);

  const handleLightboxOpen = useCallback(
    (index: number, source: HTMLElement | null) => {
      lightboxSourceRef.current = source;
      setLightboxIndex(index);
      setLightboxOpen(true);
    },
    [],
  );

  // Resolved from the clicked wrapper's siblings rather than a ref on the media
  // container: `mediaNode` is placed in two mutually exclusive branches, and a
  // quoted post nests a second PostCard whose media must not be picked up here.
  const getLightboxSource = useCallback(
    (index: number) =>
      lightboxSourceRef.current?.parentElement?.querySelector<HTMLElement>(
        `[data-lightbox-index="${index}"]`,
      ) ?? null,
    [],
  );

  const avatarButton = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full p-0 hover:bg-transparent shrink-0",
        isEmbedded ? "h-6 w-6" : "h-10 w-10 sm:h-12 sm:w-12",
      )}
      onClick={handleUserClick}
      aria-label={t("viewProfile", { name: displayName })}
    >
      <Avatar className={isEmbedded ? "h-6 w-6" : "h-11 w-11 sm:h-12 sm:w-12"}>
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </Button>
  );

  // Without a badge the avatar keeps its original markup, so every existing
  // caller is untouched.
  const avatarNode = avatarBadge ? (
    <span className="relative inline-flex shrink-0">
      {avatarButton}
      {/* Card-coloured with a matching ring, so it reads as cut out of the
          avatar rather than as a chip sitting on top. */}
      <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-c-1 ring-2 ring-card">
        {avatarBadge}
      </span>
    </span>
  ) : (
    avatarButton
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
        {/* flex, not block: cn merges these over DisplayName's own inline-flex,
            and a display override there would stack the name and the lock. The
            truncation lives on the name span inside DisplayName. */}
        <DisplayName
          name={displayName}
          isPrivate={post.author?.isPrivate}
          isMuted={post.author?.isMuted}
          isBlocked={post.author?.isBlocking}
          className="flex max-w-full min-w-0 [&_*]:max-w-full"
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
      className="ml-auto text-muted-foreground text-xs shrink-0"
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
          className={cn(!verticalIdentity && "-my-4", "h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease")}
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
          className={cn(!verticalIdentity && "-my-4", "h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease")}
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
          {hideActions.map((action) => (
            <Button
              key={action.key}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                action.destructive && "text-destructive",
              )}
              onClick={() => {
                // The drawer has to close first: blocking opens a confirmation
                // of its own, and two stacked drawers trap the dismiss.
                setMenuOpen(false);
                action.run();
              }}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
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

  const indicatorMoreMenuNode = indicator?.sourcePostId && (isDesktop ? (
    <DropdownMenu open={indicatorMenuOpen} onOpenChange={setIndicatorMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-my-4 h-8 w-8 p-0 transition-colors duration-160 ease"
          aria-label={t("actions.more")}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Copy className="h-4 w-4" />
            {t("actions.copy")}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onSelect={handleCopyBoostUserId}
                disabled={!indicator?.actorUserId}
              >
                <User className="h-4 w-4" />
                {t("actions.copyUserId")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleCopyBoostPostId}>
                <MessageCircle className="h-4 w-4" />
                {t("actions.copyPostId")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        {canUndoBoost && (
          <DropdownMenuItem onSelect={handleUndoBoost}>
            <RotateCcw className="h-4 w-4" />
            {t("actions.undoBoost")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Drawer open={indicatorMenuOpen} onOpenChange={setIndicatorMenuOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-my-4 h-8 w-8 p-0 transition-colors duration-160 ease"
          aria-label={t("actions.more")}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex flex-col gap-2 p-2 pb-4">
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
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleCopyBoostUserId}
                  disabled={!indicator?.actorUserId}
                >
                  <User className="h-4 w-4" />
                  {t("actions.copyUserId")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={handleCopyBoostPostId}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("actions.copyPostId")}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
          {canUndoBoost && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleUndoBoost}
            >
              <RotateCcw className="h-4 w-4" />
              {t("actions.undoBoost")}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  ));

  const indicatorNode = indicator && (
    <PostCardIndicatorRow
      indicator={indicator}
      locale={locale}
      menuNode={showMoreMenu ? indicatorMoreMenuNode : undefined}
    />
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

  const referenceNode = !isEmbedded && (post.reference ? (
    <div
      className={cn(
        verticalIdentity ? "mt-3 mb-1 sm:mb-1.5" : "mb-2 sm:mb-3",
      )}
    >
      <PostCard post={post.reference} variant="embedded" isLast onUserClick={onUserClick} />
    </div>
  ) : post.referenceId ? (
    <div
      className={cn(
        verticalIdentity ? "mt-3 mb-1 sm:mb-1.5" : "mb-2 sm:mb-3",
      )}
    >
      <DeletedPostCard
        referenceId={post.referenceId}
        variant="embedded"
        isLast
        restricted={post.referenceRestricted}
      />
    </div>
  ) : null);

  const mediaNode = (ogpUrl || previewMedia.length > 0) && (
    <div
      className={cn(
        verticalIdentity ? "mt-3 mb-1 sm:mb-1.5" : !isEmbedded && "mb-2 sm:mb-3",
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
          {/* Reply */}
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

          {/* Boost */}
          {boostBlocked ? (
            <Button
              variant="ghost"
              size="sm"
              disabled
              title={t("actions.boostDisabledPrivate")}
              aria-label={t("actions.boostDisabledPrivate")}
              // pointer-events stay on so the cursor and tooltip still land on a
              // disabled button, which is the whole point of showing it.
              className={cn(
                "h-8 text-muted-foreground disabled:pointer-events-auto disabled:cursor-not-allowed",
                post.boostCount > 0 ? "px-2 gap-1" : "w-8 p-0",
              )}
            >
              <Ban className="h-5 w-5" />
              {post.boostCount > 0 && (
                <span className="text-xs tabular-nums">{post.boostCount}</span>
              )}
            </Button>
          ) : isDesktop ? (
            <DropdownMenu open={boostMenuOpen} onOpenChange={setBoostMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-muted-foreground transition-colors duration-160 ease hover:text-foreground",
                    post.boostCount > 0 ? "px-2 gap-1" : "w-8 p-0",
                  )}
                  aria-label={t("actions.boost")}
                >
                  <Rocket className="h-5 w-5" />
                  {post.boostCount > 0 && (
                    <span className="text-xs tabular-nums">{post.boostCount}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => { setBoostMenuOpen(false); handleBoost(); }}>
                  <Rocket className="h-4 w-4" />
                  {t("actions.boost")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { setBoostMenuOpen(false); setQuoteDialogOpen(true); }}>
                  <Quote className="h-4 w-4" />
                  {t("actions.quote")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Drawer open={boostMenuOpen} onOpenChange={setBoostMenuOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-muted-foreground transition-colors duration-160 ease hover:text-foreground",
                    post.boostCount > 0 ? "px-2 gap-1" : "w-8 p-0",
                  )}
                  aria-label={t("actions.boost")}
                >
                  <Rocket className="h-5 w-5" />
                  {post.boostCount > 0 && (
                    <span className="text-xs tabular-nums">{post.boostCount}</span>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex flex-col gap-2 p-2 pb-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => { setBoostMenuOpen(false); handleBoost(); }}
                  >
                    <Rocket className="h-4 w-4" />
                    {t("actions.boost")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => { setBoostMenuOpen(false); setQuoteDialogOpen(true); }}
                  >
                    <Quote className="h-4 w-4" />
                    {t("actions.quote")}
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {/* Reaction Picker */}
          <ReactionPicker
            onEmojiSelect={handleToggleReaction}
            disabled={isPending}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <BookmarkButton postId={post.id} initialListIds={post.bookmarkListIds} />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground transition-colors duration-160 ease hover:text-foreground"
            aria-label={!canNativeShare || shiftHeld ? t("actions.copyLink") : t("actions.share")}
            onClick={handleShare}
          >
            {!canNativeShare || shiftHeld ? <Link2 className="h-5 w-5" /> : <Share className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <CreateReplyDialog
        open={replyDialogOpen}
        onOpenChange={setReplyDialogOpen}
        parentId={post.id}
        contentPrefix={post.author?.username ? `@${post.author.username} ` : undefined}
      />
      <CreateQuoteDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        referenceId={post.id}
        quotedPost={post}
      />
    </>
  );

  // Placed last, after every hook: an early return above them would change the
  // hook order the moment a card is revealed.
  //
  // Feeds never reach this — the server drops hidden authors from both
  // timelines. What lands here is a quoted post, a reply's parent, a search hit,
  // a bookmark: places the viewer navigated to on purpose, where the answer is a
  // cushion rather than a hole in the thread.
  if (hiddenKind) {
    return (
      <HiddenPostCard
        kind={hiddenKind}
        onReveal={() => setRevealHidden(true)}
        isLast={isLast}
        threadLine={threadLine}
        embedded={isEmbedded}
        className={className}
      />
    );
  }

  return (
    <article
      ref={articleRef}
      className={cn(
        "relative text-card-foreground p-3 transition-colors",
        !isLast && !showBelowLine && !isEmbedded && "border-b border-border",
        isCompact && "max-h-48 overflow-hidden",
        isEmbedded && "border border-border rounded-xl overflow-hidden",
        className,
      )}
    >
      {showAboveLine && <ThreadConnectorLine position="above" />}
      {showBelowLine && <ThreadConnectorLine position="below" />}

      {indicatorNode}

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
              {showMoreMenu && moreMenuNode}
            </div>
          </div>
          {bodyNode}
          {referenceNode}
          {mediaNode}
          {timestampPlacement === "afterContent" && standaloneTimestampNode}
          {showReactions && reactionsRowNode}
        </>
      ) : (
        <div className="flex items-start gap-3">
          {avatarNode}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className={cn((!isEmbedded || mediaNode) && "mb-1 sm:mb-1.5")}>
              <div className="flex min-w-0 items-center gap-2">
                {identityStackNode}
                {timestampPlacement === "header" && timestampNode}
                {showMoreMenu && moreMenuNode}
              </div>
              {bodyNode}
            </div>
            {referenceNode}
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
      <Lightbox
        items={lightboxItems}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
        getSource={getLightboxSource}
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

      {/* At article level rather than beside the menu: the menu is rendered from
          several layout branches, and the compact variant skips the row the
          other dialogs live in. Inert until blocking is chosen. */}
      {hideDialog}
    </article>
  );
}
