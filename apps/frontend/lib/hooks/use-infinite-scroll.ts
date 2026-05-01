"use client";

import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  enabled: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void | Promise<unknown>;
  rootMargin?: string;
};

export function useInfiniteScroll({
  enabled,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = "400px 0px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (
      !sentinel ||
      !enabled ||
      !hasNextPage ||
      isFetchingNextPage ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, fetchNextPage, hasNextPage, isFetchingNextPage, rootMargin]);

  return sentinelRef;
}
