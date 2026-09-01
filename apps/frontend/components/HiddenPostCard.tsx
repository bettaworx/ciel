"use client";

import { useTranslations } from "next-intl";
import { Ban, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostPlaceholderCard } from "@/components/PostPlaceholderCard";
import type { PostCardThreadLine } from "@/components/PostCard";

import type { HiddenKind } from "@/lib/moderation/visibility";

export type HiddenPostKind = HiddenKind;

/**
 * Stands in for a post whose author the viewer has muted or blocked, in the
 * places such a post can still legitimately turn up: a quoted post, a reply's
 * parent, a search hit, a bookmark, a notification.
 *
 * A cushion rather than a removal, because the viewer asked to skip this account
 * in their feeds — not to be unable to follow a conversation they opened on
 * purpose. Feeds do drop these posts outright; nothing here is reachable from
 * one.
 *
 * Revealing is per card and lasts as long as the card is mounted. The post data
 * is already in the response, so this hides rather than withholds: fine for a
 * preference, and it is why the reveal is instant.
 */
export function HiddenPostCard({
  kind,
  onReveal,
  isLast = false,
  threadLine = "none",
  embedded = false,
  className,
}: {
  kind: HiddenPostKind;
  onReveal: () => void;
  isLast?: boolean;
  threadLine?: PostCardThreadLine;
  embedded?: boolean;
  className?: string;
}) {
  const t = useTranslations("postCard.hiddenPost");

  return (
    <PostPlaceholderCard
      icon={kind === "blocked" ? Ban : VolumeX}
      label={t(kind)}
      // The only placeholder describing a decision the viewer made, so the only
      // one drawn in red.
      tone="destructive"
      action={
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-muted-foreground"
          onClick={onReveal}
        >
          {t("reveal")}
        </Button>
      }
      isLast={isLast}
      threadLine={threadLine}
      embedded={embedded}
      className={className}
    />
  );
}
