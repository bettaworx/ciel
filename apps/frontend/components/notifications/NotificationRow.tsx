"use client";

import { useLocale, useTranslations } from "next-intl";
import { Heart, Rocket } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmojiInline } from "@/components/EmojiInline";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";

type Notification = components["schemas"]["Notification"];

/**
 * Compact one-line notification, used for reactions and pure boosts where the
 * referenced post is the recipient's own and only needs an excerpt.
 */
export function NotificationRow({
  notification,
  isLast,
}: {
  notification: Notification;
  isLast: boolean;
}) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("notifications");
  const actor = notification.actor;
  const displayName = actor?.displayName || actor?.username || "";
  const excerpt = notification.post?.content ?? "";

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3",
        !isLast && "border-b border-border",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={actor?.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback>
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-c-1">
          {notification.type === "reaction" ? (
            notification.emoji ? (
              <EmojiInline emoji={notification.emoji} className="h-3.5 w-3.5" />
            ) : (
              <Heart className="h-3 w-3" />
            )
          ) : (
            <Rocket className="h-3 w-3" />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 truncate text-sm">
            {t(`types.${notification.type}`, { name: displayName })}
          </span>
          <time
            className="shrink-0 text-xs text-muted-foreground"
            dateTime={notification.createdAt}
          >
            {formatTimeAgo(new Date(notification.createdAt), locale)}
          </time>
        </div>
        {excerpt && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {excerpt}
          </p>
        )}
      </div>
    </div>
  );
}
