"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThreadConnectorLine, type PostCardThreadLine } from "@/components/PostCard";
import { cn } from "@/lib/utils";

/**
 * Stands in for a reply's parent when that parent belongs to a private account
 * the viewer does not follow.
 *
 * The reply itself is public and stays visible, but its parent cannot be shown,
 * and dropping it silently leaves a reply that answers nothing. This renders the
 * shape of a post — default avatar, a placeholder name, a redacted body — so the
 * conversation still reads as a conversation.
 *
 * Nothing real is disclosed: the id is one the caller already holds from the
 * reply, and no author name, avatar or content is fetched. There are no actions,
 * because every one of them would be refused.
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

  const showAboveLine = threadLine === "above" || threadLine === "both";
  const showBelowLine = threadLine === "below" || threadLine === "both";
  const displayName = t("privatePost.username");

  return (
    <article
      className={cn(
        "relative p-3 text-card-foreground transition-colors",
        !isLast && !showBelowLine && "border-b border-border",
        className,
      )}
    >
      {showAboveLine && <ThreadConnectorLine position="above" />}
      {showBelowLine && <ThreadConnectorLine position="below" />}

      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0 sm:h-12 sm:w-12">
          <AvatarImage src="/assets/Default-Avatar.png" alt={displayName} />
          <AvatarFallback>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex max-w-full min-w-0 items-center gap-1.5 overflow-hidden">
            <span className="block max-w-full min-w-0 truncate overflow-hidden text-left text-sm font-semibold whitespace-nowrap text-foreground sm:text-base">
              {displayName}
            </span>
            <Lock className="h-[0.8em] w-[0.8em] shrink-0 text-muted-foreground" />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("privatePost.label")}
          </p>
        </div>
      </div>
    </article>
  );
}
