"use client";

import Image from "next/image";
import { useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ReactionBadge } from "@/components/ReactionBadge";
import { ReactionPicker } from "@/components/ReactionPicker";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { useReactions } from "@/lib/hooks/use-reactions";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { components } from "@/lib/api/api";

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
  const { reactions, toggleReaction, isPending } = useReactions(post.id);

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

  // Generate initials for avatar fallback
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get media URL helper
  const getMediaUrl = (m: Media) => {
    // Use the storage URL directly from the media object
    return m.url;
  };

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
                      src={getMediaUrl(media[0])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 600px) 100vw, 600px"
                    />
                  </div>
                </div>
              )}

              {/* 2 images: 8:9 aspect ratio, side by side */}
              {media.length === 2 && (
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div className="relative bg-muted aspect-[8/9] overflow-hidden">
                    <Image
                      src={getMediaUrl(media[0])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-l-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                  <div className="relative bg-muted aspect-[8/9] overflow-hidden">
                    <Image
                      src={getMediaUrl(media[1])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-r-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                </div>
              )}

              {/* 3 images: Left auto-height, Right top/bottom 16:9 */}
              {media.length === 3 && (
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div className="relative bg-muted row-span-2 overflow-hidden">
                    <Image
                      src={getMediaUrl(media[0])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-l-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={getMediaUrl(media[1])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-tr-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={getMediaUrl(media[2])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-br-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                </div>
              )}

              {/* 4 images: 2x2 grid, all 16:9 */}
              {media.length === 4 && (
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={getMediaUrl(media[0])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-tl-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={getMediaUrl(media[1])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-tr-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={getMediaUrl(media[2])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-bl-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
                    />
                  </div>
                  <div className="relative bg-muted aspect-video overflow-hidden">
                    <Image
                      src={getMediaUrl(media[3])}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover rounded-br-xl"
                      sizes="(max-width: 600px) 50vw, 300px"
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
          <div className="mt-3">
            <ReactionPicker
              onEmojiSelect={handleToggleReaction}
              disabled={isPending}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
