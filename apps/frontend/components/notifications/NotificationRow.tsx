"use client";

import type { ReactNode } from "react";
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

function ActorAvatar({
  actor,
  className,
  onUserClick,
}: {
  actor: Actor;
  className?: string;
  onUserClick?: (username: string) => void;
}) {
  const name = actor.displayName || actor.username;
  const avatar = (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={actor.avatarUrl ?? undefined} alt={name} />
      <AvatarFallback className="text-xs">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
  if (!onUserClick) return avatar;
  return (
    <button
      type="button"
      // The whole row navigates to the post, so keep that from firing too.
      onClick={(e) => {
        e.stopPropagation();
        onUserClick(actor.username);
      }}
      aria-label={name}
      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-ring"
    >
      {avatar}
    </button>
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
  onUserClick,
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
  /** When given, actor avatars and the name in the label open their profile. */
  onUserClick?: (username: string) => void;
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

  const primaryActor = actors[0];
  const label =
    count > 1
      ? t(`grouped.${displayType}`, { name: displayName, count: count - 1 })
      : t(`types.${displayType}`, { name: displayName });

  // The name is linked by splitting the rendered sentence rather than by adding
  // a tag to the message: these same keys feed PostCardIndicatorRow, which
  // passes the label to MfmRenderer as source text and needs a plain string.
  const labelNode =
    onUserClick && primaryActor
      ? linkifyName(label, displayName, (name) => (
          <button
            key="actor"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUserClick(primaryActor.username);
            }}
            className="font-medium hover:underline"
          >
            {name}
          </button>
        ))
      : label;

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
          {primaryActor ? (
            <ActorAvatar
              actor={primaryActor}
              className="h-10 w-10"
              onUserClick={onUserClick}
            />
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
          <span className="min-w-0 truncate text-sm font-normal">
            {labelNode}
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
                onUserClick={onUserClick}
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

/**
 * Wraps the first occurrence of `name` in the label so it can be made clickable.
 * Returns the label untouched when the name is absent.
 */
function linkifyName(
  label: string,
  name: string,
  render: (name: string) => ReactNode,
): ReactNode {
  if (!name) return label;
  const at = label.indexOf(name);
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      {render(name)}
      {label.slice(at + name.length)}
    </>
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
