"use client";

import { useMemo, useState, useEffect } from "react";
import { parse as parseTwemoji } from "@twemoji/parser";
import { useEmojiData, resolveEmoji } from "./use-emoji-data";
import { useCustomEmojis } from "@/lib/hooks/use-queries";
import {
  useRecentEmojis,
  useEmojiSkinTone,
} from "@/atoms/emoji-picker";
import {
  RECENT_CATEGORY_ICON,
  CUSTOM_CATEGORY_ICON,
  buildTwemojiUrl,
} from "./constants";
import type { EmojiItem, EmojiCategory } from "./types";

// ---------------------------------------------------------------------------
// Pre-compute image src URL for a single EmojiItem.
// Called once in the data layer so the render path is pure React props.
// ---------------------------------------------------------------------------

function computeSrc(item: EmojiItem): string | null {
  if (item.type === "custom") return item.imageUrl ?? null;
  if (!item.emoji) return null;
  const entries = parseTwemoji(item.emoji, {
    buildUrl: buildTwemojiUrl,
    assetType: "svg",
  });
  return entries.length === 1 ? entries[0].url : null;
}

function withSrc(item: EmojiItem): EmojiItem {
  return { ...item, src: computeSrc(item) };
}

// ---------------------------------------------------------------------------
// Debounce helper
// ---------------------------------------------------------------------------

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Build the unified category list
// ---------------------------------------------------------------------------

export function useEmojiPickerData(searchQuery: string) {
  const { data: emojiData, isLoading: emojiLoading } = useEmojiData();
  const { data: customEmojis } = useCustomEmojis();
  const recentKeys = useRecentEmojis();
  const skinTone = useEmojiSkinTone();

  // Debounce search so we don't recompute on every keystroke
  const debouncedQuery = useDebouncedValue(searchQuery.trim().toLowerCase(), 150);

  const categories = useMemo(() => {
    if (!emojiData) return [];

    const result: EmojiCategory[] = [];
    const query = debouncedQuery;

    // --- Recent category ---
    if (!query && recentKeys.length > 0) {
      const standardMap = new Map<string, EmojiItem>();
      for (const cat of emojiData.categories) {
        for (const item of cat.emojis) {
          if (item.emoji) standardMap.set(item.emoji, item);
        }
      }
      const customMap = new Map<string, EmojiItem>();
      if (customEmojis) {
        for (const ce of customEmojis) {
          customMap.set(`:${ce.shortcode}:`, {
            type: "custom",
            label: ce.name || ce.shortcode,
            shortcode: ce.shortcode,
            imageUrl: ce.imageUrl,
            src: ce.imageUrl ?? null,
          });
        }
      }

      const recentItems: EmojiItem[] = [];
      for (const key of recentKeys) {
        const standard = standardMap.get(key);
        if (standard) {
          recentItems.push(standard);
          continue;
        }
        const custom = customMap.get(key);
        if (custom) recentItems.push(custom);
      }

      if (recentItems.length > 0) {
        result.push({
          id: "recent",
          label: "Recently Used",
          labelKey: "recentlyUsed",
          icon: RECENT_CATEGORY_ICON,
          emojis: recentItems,
        });
      }
    }

    // --- Custom category ---
    if (customEmojis && customEmojis.length > 0) {
      const items: EmojiItem[] = customEmojis.map((ce) => ({
        type: "custom" as const,
        label: ce.name || ce.shortcode,
        shortcode: ce.shortcode,
        imageUrl: ce.imageUrl,
        src: ce.imageUrl ?? null,
      }));

      const filtered = query
        ? items.filter(
            (item) =>
              (item.shortcode?.toLowerCase().includes(query) ?? false) ||
              item.label.toLowerCase().includes(query),
          )
        : items;

      if (filtered.length > 0) {
        result.push({
          id: "custom",
          label: "Custom",
          labelKey: "custom",
          icon: CUSTOM_CATEGORY_ICON,
          emojis: filtered,
        });
      }
    }

    // --- Standard categories ---
    for (const cat of emojiData.categories) {
      const filtered = query
        ? cat.emojis.filter((item) =>
            item.label.toLowerCase().includes(query),
          )
        : cat.emojis;

      if (filtered.length === 0) continue;

      // Apply skin tone and pre-compute src in one pass
      const resolved = filtered.map((item) => {
        const resolvedEmoji =
          skinTone !== 0 ? resolveEmoji(item, skinTone) : item.emoji;
        const emojiForSrc =
          resolvedEmoji !== item.emoji
            ? { ...item, emoji: resolvedEmoji }
            : item;
        return withSrc(emojiForSrc);
      });

      result.push({ ...cat, emojis: resolved });
    }

    return result;
  }, [emojiData, customEmojis, recentKeys, skinTone, debouncedQuery]);

  return {
    categories,
    isLoading: emojiLoading,
    isEmpty: !emojiLoading && categories.length === 0,
  };
}
