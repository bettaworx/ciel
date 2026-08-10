"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api/use-api";
import { markNotificationsReadInCache, queryKeys } from "@/lib/hooks/use-queries";
import type { components } from "@/lib/api/api";

type UnreadCount = components["schemas"]["UnreadCount"];

/**
 * Delay before flushing hovered notifications. Long enough that sweeping the
 * cursor across the list does not mark everything it passes over as read.
 */
const FLUSH_DELAY_MS = 400;

/**
 * Marks notifications read as the user hovers (or taps) them.
 *
 * Ids are buffered and flushed as one request, and the cache is updated
 * optimistically so the unread highlight fades immediately.
 */
export function useMarkNotificationsSeen() {
  const api = useApi();
  const queryClient = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set());
  const sentRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    timerRef.current = null;
    const ids = [...pendingRef.current];
    pendingRef.current.clear();
    if (ids.length === 0) return;

    // Clear the highlight and drop the badge before the request lands.
    markNotificationsReadInCache(queryClient, ids);
    queryClient.setQueryData<UnreadCount>(queryKeys.notificationsUnread, (old) =>
      old ? { count: Math.max(0, old.count - ids.length) } : old,
    );

    const result = await api.markNotificationsRead(ids);
    if (result.ok) {
      // Trust the server's count over our local decrement.
      queryClient.setQueryData<UnreadCount>(queryKeys.notificationsUnread, result.data);
      return;
    }
    // Allow a retry on the next hover and re-sync the count.
    for (const id of ids) sentRef.current.delete(id);
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
  }, [api, queryClient]);

  const markSeen = useCallback(
    (id: string) => {
      if (sentRef.current.has(id)) return;
      sentRef.current.add(id);
      pendingRef.current.add(id);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), FLUSH_DELAY_MS);
    },
    [flush],
  );

  // Don't lose notifications the user hovered right before navigating away.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        void flush();
      }
    };
  }, [flush]);

  return markSeen;
}
