"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AtSign, Quote, Reply, Rocket, Smile, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmojiInline } from "@/components/EmojiInline";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import {
  DISPLAY_NAME_ALLOW_LIST,
  NOTIFICATION_EXCERPT_ALLOW_LIST,
  mfmToPlainText,
} from "@/lib/mfm/parse";
import {
  notificationActorCount,
  notificationActors,
  notificationCount,
  notificationDisplayType,
  notificationExcerpt,
  usesActorCountLabel,
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
  typeof Smile
> = {
  // Smile is the reaction affordance on a post card; keep the vocabulary shared.
  reaction: Smile,
  reply: Reply,
  mention: AtSign,
  boost: Rocket,
  quote: Quote,
  follow: UserPlus,
};

/**
 * How many avatars fit per breakpoint. Approximate by design — the exact count
 * would need measuring, and the total is already spelled out in the label.
 */
const AVATARS_NARROW = 6;
const AVATARS_WIDE = 8;

function ActorAvatar({
  actor,
  size = "h-8 w-8",
  showEmoji = true,
  className,
  onUserClick,
}: {
  actor: Actor;
  size?: string;
  /** Off where the row already badges the type onto this same corner. */
  showEmoji?: boolean;
  className?: string;
  onUserClick?: (username: string) => void;
}) {
  const user = actor.user;
  // alt, aria-label and the initials all need a bare string, so the MFM in a
  // display name is stripped rather than rendered here.
  const name = mfmToPlainText(user.displayName || user.username);
  const avatar = (
    <span className={cn("relative inline-flex", className)}>
      <Avatar className={size}>
        <AvatarImage src={user.avatarUrl ?? undefined} alt={name} />
        <AvatarFallback className="text-xs">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {/* A row covers a whole post, so each avatar carries its own emoji. */}
      {showEmoji && actor.emoji && (
        // Emoji images are sized in em (see .twemoji), so the font size is what
        // fits them to the circle — width/height classes do nothing here.
        <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center overflow-hidden rounded-full bg-card text-[10px] leading-none ring-2 ring-card">
          <EmojiInline emoji={actor.emoji} />
        </span>
      )}
    </span>
  );
  if (!onUserClick) return avatar;
  return (
    <button
      type="button"
      // The whole row navigates to the post, so keep that from firing too.
      onClick={(e) => {
        e.stopPropagation();
        onUserClick(user.username);
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
  const displayName =
    actors[0]?.user.displayName || actors[0]?.user.username || "";
  const excerpt = notificationExcerpt(notification);
  const displayType = notificationDisplayType(notification);
  const Icon = NOTIFICATION_ICONS[displayType];
  const actorRowLayout = !singleActor && usesActorRowLayout(displayType);
  // No excerpt and no actor row means the content is a single line. Beside a
  // 48px avatar, top-aligned, that leaves the whole space under the label
  // empty — centre it instead and keep the avatar small.
  const compact = !excerpt && !actorRowLayout;

  const primaryActor = actors[0];
  const actorCount = notificationActorCount(notification);
  // Reactions and follows branch on people, not events: one person leaving three
  // emoji is still one person, so they keep the named form.
  const label = usesActorCountLabel(displayType)
    ? actorCount > 1
      ? t(`grouped.${displayType}`, { count: actorCount })
      : t(`types.${displayType}`, { name: displayName })
    : count > 1
      ? t(`grouped.${displayType}`, { name: displayName, count: count - 1 })
      : t(`types.${displayType}`, { name: displayName });

  // The name is picked out of the rendered sentence rather than tagged in the
  // message: these same keys feed PostCardIndicatorRow, which passes the label
  // to MfmRenderer as source text and needs a plain string.
  const labelNode = replaceName(label, displayName, (name) => {
    // A display name carries MFM, but only what fits on one line — the
    // allow-list drops everything that would animate or resize the row.
    const rendered = (
      <MfmRenderer text={name} allowList={DISPLAY_NAME_ALLOW_LIST} />
    );
    if (!onUserClick || !primaryActor) return rendered;
    return (
      <button
        key="actor"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUserClick(primaryActor.user.username);
        }}
        className="font-medium hover:underline"
      >
        {rendered}
      </button>
    );
  });

  // Reactions show the emoji itself; every other kind shows its icon.
  const typeGlyph = (size: string) =>
    notification.type === "reaction" && notification.emoji ? (
      <EmojiInline emoji={notification.emoji} className={size} />
    ) : (
      <Icon className={size} />
    );

  return (
    <div
      className={cn(
        "flex gap-3 p-3",
        compact ? "items-center" : "items-start",
        className,
      )}
    >
      {actorRowLayout ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-c-1 sm:h-12 sm:w-12">
          {/* A row can span several emoji now, so the type icon leads and each
              avatar carries the emoji its actor used. */}
          <Icon className="h-5 w-5" />
        </span>
      ) : (
        <div className="relative shrink-0">
          {/* Never grouped, so there is always exactly one actor here. */}
          {primaryActor ? (
            <ActorAvatar
              actor={primaryActor}
              size={compact ? "h-10 w-10" : "h-10 w-10 sm:h-12 sm:w-12"}
              showEmoji={false}
              onUserClick={onUserClick}
            />
          ) : (
            <span className="block h-10 w-10 rounded-full bg-muted" />
          )}
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-card text-c-1 ring-2 ring-card">
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
                key={`${actor.user.id}:${actor.emoji ?? ""}`}
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
 * Hands the first occurrence of `name` in the label to `render`, so it can be
 * rendered as MFM and made clickable. Returns the label untouched when the name
 * is absent — the grouped reaction and follow labels never name anyone.
 */
function replaceName(
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
