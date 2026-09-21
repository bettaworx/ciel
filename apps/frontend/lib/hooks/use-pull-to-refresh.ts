"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<unknown>;
  threshold?: number;
  maxDistance?: number;
};

type UsePullToRefreshResult = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dragDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  threshold: number;
};

/**
 * タッチ操作によるプル・トゥ・リフレッシュを検知するフック。
 *
 * ラップした要素がスクロール最上部にいる状態で、下方向に引っ張ると
 * ドラッグ距離に応じたフィードバックを返し、閾値を超えてリリースした
 * タイミングで `onRefresh` を実行します。
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxDistance = 150,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragDistance, setDragDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isTrackingRef = useRef(false);
  const dragDistanceRef = useRef(0);

  const getScrollTop = useCallback(() => {
    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      return container.scrollTop;
    }
    return window.scrollY || document.documentElement.scrollTop;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (getScrollTop() > 0) return;
      startYRef.current = e.touches[0].clientY;
      isTrackingRef.current = true;
      setIsPulling(true);
    },
    [getScrollTop],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isTrackingRef.current) return;

      const y = e.touches[0].clientY;
      const diff = y - startYRef.current;

      if (diff < 0) {
        isTrackingRef.current = false;
        setIsPulling(false);
        dragDistanceRef.current = 0;
        setDragDistance(0);
        return;
      }

      const damped = Math.min(diff * 0.5, maxDistance);
      dragDistanceRef.current = damped;
      setDragDistance(damped);
    },
    [maxDistance],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isTrackingRef.current) return;
    isTrackingRef.current = false;
    setIsPulling(false);

    const currentDistance = dragDistanceRef.current;
    dragDistanceRef.current = 0;
    setDragDistance(0);

    if (currentDistance >= threshold) {
      setIsRefreshing(true);
      const startTime = Date.now();
      try {
        await onRefresh();
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 500 - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        setIsRefreshing(false);
      }
    }
  }, [onRefresh, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    dragDistance,
    isPulling,
    isRefreshing,
    threshold,
  };
}
