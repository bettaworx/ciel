"use client";

import { Ban, Lock, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
import { cn } from "@/lib/utils";

interface DisplayNameProps {
  /** The name to render. Already resolved by the caller, so it can fall back to a handle. */
  name: string;
  /** Whether the account is private. Draws the lock. */
  isPrivate?: boolean | null;
  /** Whether the caller has muted this account. Draws the muted speaker. */
  isMuted?: boolean | null;
  /** Whether the caller has blocked this account. Draws the prohibition sign. */
  isBlocked?: boolean | null;
  className?: string;
}

/**
 * A user's display name, with a lock beside it when the account is private and a
 * red marker when the caller has muted or blocked it.
 *
 * Use this wherever a name stands on its own: post headers, profiles, follow and
 * reaction lists, menus.
 *
 * Do NOT use it where the name is substituted into a sentence — notification
 * text like "{name} reacted to your post", or the "{name} boosted" indicator.
 * Those build one string and hand the whole thing to MfmRenderer, so a lock
 * dropped in the middle would read as part of the sentence rather than as a
 * property of the account. That split is the whole reason this component exists;
 * the rule is enforced by which call sites use it, not by a prop.
 */
export function DisplayName({
  name,
  isPrivate,
  isMuted,
  isBlocked,
  className,
}: DisplayNameProps) {
  const t = useTranslations();

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      {/* min-w-0 as well as truncate: a flex item will not shrink below its
          content without it, so a long name would push the lock out instead of
          being cut short. */}
      <span className="min-w-0 truncate">
        <MfmRenderer text={name} allowList={DISPLAY_NAME_ALLOW_LIST} />
      </span>
      {isPrivate && (
        // Sized in em, not a fixed class: this renders beside everything from a
        // text-sm list row to the text-xl heading on a profile, and a fixed size
        // would loom over the small ones and get lost beside the large ones.
        <Lock
          className="h-[0.8em] w-[0.8em] shrink-0 text-muted-foreground"
          aria-label={t("user.privateAccount")}
        />
      )}
      {/* Only one of these ever shows: the server sends isBlocking or isMuted,
          never both, since a block is the stronger of the two. Same em sizing as
          the lock, in destructive red because these describe a decision the
          viewer made rather than a property of the account. */}
      {isBlocked && (
        <Ban
          className="h-[0.8em] w-[0.8em] shrink-0 text-destructive"
          aria-label={t("user.blockedAccount")}
        />
      )}
      {isMuted && (
        <VolumeX
          className="h-[0.8em] w-[0.8em] shrink-0 text-destructive"
          aria-label={t("user.mutedAccount")}
        />
      )}
    </span>
  );
}
