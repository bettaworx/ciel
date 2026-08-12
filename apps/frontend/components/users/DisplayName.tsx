"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
import { cn } from "@/lib/utils";

interface DisplayNameProps {
  /** The name to render. Already resolved by the caller, so it can fall back to a handle. */
  name: string;
  /** Whether the account is private. Draws the lock. */
  isPrivate?: boolean | null;
  className?: string;
}

/**
 * A user's display name, with a lock beside it when the account is private.
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
export function DisplayName({ name, isPrivate, className }: DisplayNameProps) {
  const t = useTranslations();

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <span className="truncate">
        <MfmRenderer text={name} allowList={DISPLAY_NAME_ALLOW_LIST} />
      </span>
      {isPrivate && (
        <Lock
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-label={t("user.privateAccount")}
        />
      )}
    </span>
  );
}
