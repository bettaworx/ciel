"use client";

import type { ReactNode } from "react";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
import { formatFullTimestamp, formatTimeAgo } from "@/lib/utils/format-time";

export interface PostCardIndicator {
  icon: ReactNode;
  label: string;
  createdAt?: string;
  sourcePostId?: string;
  actorUserId?: string;
}

type PostCardIndicatorRowProps = {
  indicator: PostCardIndicator;
  locale: "ja" | "en";
  menuNode?: ReactNode;
};

export function PostCardIndicatorRow({
  indicator,
  locale,
  menuNode,
}: PostCardIndicatorRowProps) {
  const timestamp = indicator.createdAt
    ? formatTimeAgo(new Date(indicator.createdAt), locale)
    : null;
  const fullTimestamp = indicator.createdAt
    ? formatFullTimestamp(new Date(indicator.createdAt), locale)
    : null;

  return (
    <div className="-mx-3 -mt-3 mb-1 flex items-center gap-3 px-3 pt-3 pb-1 text-xs text-c-foreground-1">
      <div className="flex w-10 shrink-0 items-center justify-end sm:w-12">
        {indicator.icon}
      </div>
      <div className="flex flex-1 min-w-0 items-center">
        <MfmRenderer text={indicator.label} allowList={DISPLAY_NAME_ALLOW_LIST} />
        {(timestamp || menuNode) && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {timestamp && (
              <span aria-label={fullTimestamp ?? undefined}>
                {timestamp}
              </span>
            )}
            {menuNode}
          </div>
        )}
      </div>
    </div>
  );
}
