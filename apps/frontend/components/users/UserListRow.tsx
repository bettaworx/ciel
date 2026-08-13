"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DisplayName } from "@/components/users/DisplayName";
import { BIO_ALLOW_LIST } from "@/lib/mfm/parse";
import { FollowButton } from "@/components/users/FollowButton";
import { HideUserMenu } from "@/components/users/HideUserMenu";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { components } from "@/lib/api/api";

type User = components["schemas"]["User"];

type UserListRowProps = {
  user: User;
  /**
   * Replaces the follow button. The mute and block lists in settings use it for
   * their undo button — offering Follow beside an account you just blocked
   * would be the wrong control in the wrong place.
   */
  action?: ReactNode;
  /**
   * Hides the "…" moderation menu. The settings lists set it: their rows already
   * carry an unmute or unblock button, so a menu offering the same thing again
   * would be the only other entry in it.
   */
  hideMenu?: boolean;
  className?: string;
};

/** One user in a follow list: avatar, name, bio, and a follow button. */
export function UserListRow({ user, action, hideMenu, className }: UserListRowProps) {
  const t = useTranslations();
  const displayName = user.displayName || `@${user.username}`;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const followsYouBadge = user.isFollowedBy ? (
    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {t("user.followsYou")}
    </span>
  ) : null;

  return (
    <Link
      href={`/users/${encodeURIComponent(user.username)}`}
      className={cn(
        // card-hover is the shared row hover for anything sitting on a card.
        "flex gap-3 rounded-2xl bg-card p-3 transition-colors hover:bg-card-hover",
        // With a bio the block is tall enough that centring it looks adrift.
        user.bio ? "items-start" : "items-center",
        className,
      )}
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-sm font-bold text-foreground">
            <DisplayName
              name={displayName}
              isPrivate={user.isPrivate}
              isMuted={user.isMuted}
              isBlocked={user.isBlocking}
            />
          </div>
          {/* Without a display name this row is the handle, so the badge
              belongs here rather than on a handle row that never renders. */}
          {!user.displayName && followsYouBadge}
        </div>
        {user.displayName && (
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-sm text-muted-foreground">
              @{user.username}
            </div>
            {followsYouBadge}
          </div>
        )}
        {user.bio && (
          <div className="mt-1 truncate text-sm text-foreground">
            <MfmRenderer text={user.bio} allowList={BIO_ALLOW_LIST} />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {action ?? (
          <FollowButton
            username={user.username}
            isFollowing={user.isFollowing ?? false}
            isPrivate={user.isPrivate}
            followRequestSent={user.followRequestSent}
            isFollowedBy={user.isFollowedBy ?? false}
            isBlockedBy={user.isBlockedBy}
            isBlocking={user.isBlocking}
          />
        )}
        {!hideMenu && <HideUserMenu user={user} />}
      </div>
    </Link>
  );
}
