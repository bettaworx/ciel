"use client";

import { useLocale, useTranslations } from "next-intl";
import { AtSign, Heart, Quote, Reply, Rocket } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmojiInline } from "@/components/EmojiInline";
import {
  notificationDisplayType,
  notificationExcerpt,
  type NotificationDisplayType,
} from "@/lib/notifications";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";

type Notification = components["schemas"]["Notification"];

/**
 * Icon per notification type. Shared with the PostCard indicator in
 * NotificationItem so the two never drift apart.
 */
export const NOTIFICATION_ICONS: Record<
  NotificationDisplayType,
  typeof Heart
> = {
  reaction: Heart,
  reply: Reply,
  mention: AtSign,
  boost: Rocket,
  quote: Quote,
};

/**
 * A single notification, rendered compactly: actor avatar with a type badge,
 * the action text, and an excerpt of the post.
 *
 * Used both for the rows on /notifications and inside realtime toasts, so it
 * carries no list chrome of its own — the caller owns dividers and spacing.
 */
export function NotificationRow({
  notification,
  showTimestamp = true,
  className,
}: {
  notification: Notification;
  /** Toasts appear the instant the event arrives, so "now" adds nothing there. */
  showTimestamp?: boolean;
  className?: string;
}) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("notifications");
  const actor = notification.actor;
  const displayName = actor?.displayName || actor?.username || "";
  const excerpt = notificationExcerpt(notification);
  const displayType = notificationDisplayType(notification);
  const Icon = NOTIFICATION_ICONS[displayType];

  return (
    <div className={cn("flex items-start gap-3 p-3", className)}>
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={actor?.avatarUrl ?? undefined} alt={displayName} />
          <AvatarFallback>
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-c-1">
          {notification.type === "reaction" && notification.emoji ? (
            <EmojiInline emoji={notification.emoji} className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {/* Weight is explicit: inside a toast this sits in sonner's title
              wrapper, which would otherwise make it bolder than in the list. */}
          <span className="min-w-0 truncate text-sm font-normal">
            {t(`types.${displayType}`, { name: displayName })}
          </span>
          {showTimestamp && (
            <time
              className="ml-auto shrink-0 text-xs text-muted-foreground"
              dateTime={notification.createdAt}
            >
              {formatTimeAgo(new Date(notification.createdAt), locale)}
            </time>
          )}
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
