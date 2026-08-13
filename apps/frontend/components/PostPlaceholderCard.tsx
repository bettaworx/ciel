"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  ThreadConnectorLine,
  type PostCardThreadLine,
} from "@/components/PostCard";
import { cn } from "@/lib/utils";

export type PostPlaceholderCardProps = {
  /** Drawn at the start of the row. Muted grey unless `tone` says otherwise. */
  icon: LucideIcon;
  /** One line saying why there is no post here. */
  label: string;
  /**
   * Red for a state the viewer chose — muting, blocking. Neutral for one that
   * simply happened to the post: deleted, private, restricted. The distinction
   * is the whole reason the icon is coloured at all.
   */
  tone?: "neutral" | "destructive";
  /** Right end of the row: a reveal button, a "…" menu. */
  action?: ReactNode;
  /** Strip above the row, e.g. the "boosted by" line. */
  indicator?: ReactNode;
  isLast?: boolean;
  threadLine?: PostCardThreadLine;
  /** Renders as a quoted card: own border, no list divider. */
  embedded?: boolean;
  className?: string;
};

/**
 * The card that stands in for a post the viewer is not being shown: deleted,
 * audience-restricted, by a private account, or by one they muted or blocked.
 *
 * One component for all of them so the five states read as one idea rather than
 * five unrelated designs — they differ only in icon, wording, and whether there
 * is something to do about it. A compact row rather than a post-shaped block:
 * these carry no content, and giving them a full card's height made a timeline
 * of them look like a timeline of posts.
 *
 * Shares PostCard's article shell so thread lines, list dividers and the
 * embedded border all line up with the real cards around it.
 */
export function PostPlaceholderCard({
  icon: Icon,
  label,
  tone = "neutral",
  action,
  indicator,
  isLast = false,
  threadLine = "none",
  embedded = false,
  className,
}: PostPlaceholderCardProps) {
  const showAboveLine = threadLine === "above" || threadLine === "both";
  const showBelowLine = threadLine === "below" || threadLine === "both";

  return (
    <article
      className={cn(
        "relative p-3 text-card-foreground transition-colors",
        !isLast && !showBelowLine && !embedded && "border-b border-border",
        embedded && "overflow-hidden rounded-xl border border-border",
        className,
      )}
    >
      {showAboveLine && <ThreadConnectorLine position="above" />}
      {showBelowLine && <ThreadConnectorLine position="below" />}

      {indicator}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              tone === "destructive"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          />
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {label}
          </span>
        </div>
        {action && <div className="flex shrink-0 items-center">{action}</div>}
      </div>
    </article>
  );
}
