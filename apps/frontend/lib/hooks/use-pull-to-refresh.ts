"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { PullToRefreshGesture } from "@/lib/pull-to-refresh";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const gestureRef = useRef(new PullToRefreshGesture());
  const refreshingRef = useRef(false);
  const mountedRef = useRef(false);

  const getScrollTop = useCallback(() => {
    const container = containerRef.current;
    if (container && container.scrollTop > 0) {
      return container.scrollTop;
    }
    return window.scrollY || document.documentElement.scrollTop;
  }, []);

  const rafRef = useRef<number | null>(null);

  const resetGesture = useCallback(() => {
    gestureRef.current.cancel();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setDragDistance(0);
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      resetGesture();
      if (refreshingRef.current || e.defaultPrevented || e.touches.length !== 1) return;
      const container = containerRef.current;
      if (!(e.target instanceof Element) || !container?.contains(e.target)) return;
      // Leave editing and nested scroll areas to their own native gestures.
      if (
        e.target.closest(
          "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
        )
      ) {
        return;
      }
      for (let element: Element | null = e.target; element; element = element.parentElement) {
        if (element.scrollTop > 0) return;
        if (element !== document.documentElement && element !== document.body) {
          const { overflowY } = getComputedStyle(element);
          if (/^(auto|scroll)$/.test(overflowY) && element.scrollHeight > element.clientHeight) {
            return;
          }
        }
      }
      gestureRef.current.start(e.touches, getScrollTop());
    },
    [getScrollTop, resetGesture],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const gesture = gestureRef.current;
      const previousDistance = gesture.distance;
      if (e.defaultPrevented) gesture.cancel();
      else gesture.move(e.touches, getScrollTop(), maxDistance);
      if (gesture.distance === previousDistance) return;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          setDragDistance(gestureRef.current.distance);
          rafRef.current = null;
        });
      }
    },
    [getScrollTop, maxDistance],
  );

  const handleTouchEnd = useEffectEvent(async (e: TouchEvent) => {
    if (e.defaultPrevented || e.touches.length !== 0 || getScrollTop() > 0) {
      resetGesture();
      return;
    }
    const shouldRefresh = gestureRef.current.release(threshold);
    resetGesture();
    if (shouldRefresh && !refreshingRef.current) {
      refreshingRef.current = true;
      setIsRefreshing(true);
      const startTime = Date.now();
      try {
        await onRefresh();
      } catch {
        // Query errors are rendered by the caller; do not leak a rejected DOM event handler.
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 500 - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        refreshingRef.current = false;
        if (mountedRef.current) setIsRefreshing(false);
      }
    }
  });

  useEffect(() => {
    mountedRef.current = true;
    const handleEnd = (e: TouchEvent) => {
      void handleTouchEnd(e);
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });
    window.addEventListener("touchcancel", resetGesture, { passive: true });

    return () => {
      mountedRef.current = false;
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", resetGesture);
      gestureRef.current.cancel();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [handleTouchStart, handleTouchMove, resetGesture]);

  return {
    containerRef,
    dragDistance,
    isPulling: dragDistance > 0,
    isRefreshing,
    threshold,
  };
}
