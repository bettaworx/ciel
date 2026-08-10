"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST, BIO_ALLOW_LIST } from "@/lib/mfm/parse";
import { FollowButton } from "@/components/users/FollowButton";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";

type User = components["schemas"]["User"];

type UserListRowProps = {
  user: User;
  className?: string;
};

/** One user in a follow list: avatar, name, bio, and a follow button. */
export function UserListRow({ user, className }: UserListRowProps) {
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
        // accent is the theme's "brighter than card" step; muted sits too close
        // to the card colour to read as a hover.
        "flex gap-3 rounded-2xl bg-card p-3 transition-colors hover:bg-accent",
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
            <MfmRenderer
              text={displayName}
              allowList={DISPLAY_NAME_ALLOW_LIST}
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

      <FollowButton
        username={user.username}
        isFollowing={user.isFollowing ?? false}
        isFollowedBy={user.isFollowedBy ?? false}
        className="shrink-0"
      />
    </Link>
  );
}
