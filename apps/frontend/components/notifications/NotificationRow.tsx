"use client";

import { useLocale, useTranslations } from "next-intl";
import { AtSign, Heart, Quote, Reply, Rocket } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmojiInline } from "@/components/EmojiInline";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { NOTIFICATION_EXCERPT_ALLOW_LIST } from "@/lib/mfm/parse";
import {
  notificationActors,
  notificationCount,
  notificationDisplayType,
  notificationExcerpt,
  usesActorRowLayout,
  type NotificationDisplayType,
} from "@/lib/notifications";
import { formatTimeAgo } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";

type Notification = components["schemas"]["Notification"];
type Actor = NonNullable<Notification["actors"]>[number];

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
 * How many avatars fit per breakpoint. Approximate by design — the exact count
 * would need measuring, and the total is already spelled out in the label.
 */
const AVATARS_NARROW = 6;
const AVATARS_WIDE = 8;

function ActorAvatar({ actor, className }: { actor: Actor; className?: string }) {
  const name = actor.displayName || actor.username;
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={actor.avatarUrl ?? undefined} alt={name} />
      <AvatarFallback className="text-xs">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * A single notification, rendered compactly.
 *
 * In the list, grouped kinds (reactions and boosts) lead with the emoji or type
 * icon and show their actors as a row of avatars. Everything else — and every
 * toast, via `singleActor` — keeps one avatar on the left with the type badged
 * onto it. Carries no list chrome of its own; the caller owns dividers and
 * spacing.
 */
export function NotificationRow({
  notification,
  showTimestamp = true,
  singleActor = false,
  className,
}: {
  notification: Notification;
  /** Toasts appear the instant the event arrives, so "now" adds nothing there. */
  showTimestamp?: boolean;
  /**
   * Force the avatar-on-the-left layout. Toasts use it: a pushed event is always
   * one action by one actor, so there is no row of actors to show.
   */
  singleActor?: boolean;
  className?: string;
}) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("notifications");
  const actors = notificationActors(notification);
  const count = notificationCount(notification);
  const displayName = actors[0]?.displayName || actors[0]?.username || "";
  const excerpt = notificationExcerpt(notification);
  const displayType = notificationDisplayType(notification);
  const Icon = NOTIFICATION_ICONS[displayType];
  const actorRowLayout = !singleActor && usesActorRowLayout(displayType);

  const label =
    count > 1
      ? t(`grouped.${displayType}`, { name: displayName, count: count - 1 })
      : t(`types.${displayType}`, { name: displayName });

  // Reactions show the emoji itself; every other kind shows its icon.
  const typeGlyph = (size: string) =>
    notification.type === "reaction" && notification.emoji ? (
      <EmojiInline emoji={notification.emoji} className={size} />
    ) : (
      <Icon className={size} />
    );

  return (
    <div className={cn("flex items-start gap-3 p-3", className)}>
      {actorRowLayout ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-c-1">
          {typeGlyph("h-5 w-5")}
        </span>
      ) : (
        <div className="relative shrink-0">
          {/* Never grouped, so there is always exactly one actor here. */}
          {actors[0] ? (
            <ActorAvatar actor={actors[0]} className="h-10 w-10" />
          ) : (
            <span className="block h-10 w-10 rounded-full bg-muted" />
          )}
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-c-1">
            {typeGlyph("h-3.5 w-3.5")}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {/* Weight is explicit: inside a toast this sits in sonner's title
              wrapper, which would otherwise make it bolder than in the list. */}
          <span className="min-w-0 truncate text-sm font-normal">{label}</span>
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
            <MfmRenderer
              text={excerpt}
              allowList={NOTIFICATION_EXCERPT_ALLOW_LIST}
            />
          </p>
        )}

        {actorRowLayout && actors.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            {actors.slice(0, AVATARS_WIDE).map((actor, index) => (
              <ActorAvatar
                key={actor.id}
                actor={actor}
                // Drop the last two on narrow screens rather than let the row
                // overflow.
                className={index >= AVATARS_NARROW ? "hidden sm:flex" : undefined}
              />
            ))}
            <Overflow count={count} shown={AVATARS_NARROW} className="sm:hidden" />
            <Overflow
              count={count}
              shown={AVATARS_WIDE}
              className="hidden sm:inline"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** "+N" for the actors that did not fit, per breakpoint. */
function Overflow({
  count,
  shown,
  className,
}: {
  count: number;
  shown: number;
  className?: string;
}) {
  if (count <= shown) return null;
  return (
    <span className={cn("ml-1 text-xs text-muted-foreground", className)}>
      +{count - shown}
    </span>
  );
}
