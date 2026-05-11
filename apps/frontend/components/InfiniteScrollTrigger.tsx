"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";

type InfiniteScrollTriggerProps = {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export function InfiniteScrollTrigger({
  sentinelRef,
  hasNextPage,
  isFetchingNextPage,
}: InfiniteScrollTriggerProps) {
  const t = useTranslations();

  return (
    <>
      {hasNextPage && <div ref={sentinelRef} className="h-px" />}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-3">
          <Spinner variant="theme" size="sm" label={t("loading")} />
        </div>
      )}
    </>
  );
}
