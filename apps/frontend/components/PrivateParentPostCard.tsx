"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { PostPlaceholderCard } from "@/components/PostPlaceholderCard";
import type { PostCardThreadLine } from "@/components/PostCard";

/**
 * Stands in for a reply's parent when that parent belongs to a private account
 * the viewer does not follow.
 *
 * The reply itself is public and stays visible, but its parent cannot be shown,
 * and dropping it silently leaves a reply that answers nothing.
 *
 * Nothing real is disclosed: no author name, avatar or content is fetched, and
 * there are no actions, because every one of them would be refused.
 *
 * An accepted follower never sees this: the server sends them the real parent
 * and leaves parentPrivate false.
 */
export function PrivateParentPostCard({
  isLast = false,
  threadLine = "none",
  className,
}: {
  isLast?: boolean;
  threadLine?: PostCardThreadLine;
  className?: string;
}) {
  const t = useTranslations("postCard");

  return (
    <PostPlaceholderCard
      icon={Lock}
      label={t("privatePost.label")}
      isLast={isLast}
      threadLine={threadLine}
      className={className}
    />
  );
}
