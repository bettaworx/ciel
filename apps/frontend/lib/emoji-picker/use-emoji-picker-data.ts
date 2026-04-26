"use client";

import { useMemo, useState, useEffect } from "react";
import { useEmojiData, resolveEmoji } from "./use-emoji-data";
import { useCustomEmojis } from "@/lib/hooks/use-queries";
import {
  useRecentEmojis,
  useEmojiSkinTone,
} from "@/atoms/emoji-picker";
import {
  RECENT_CATEGORY_ICON,
  CUSTOM_CATEGORY_ICON,
} from "./constants";
import {
  createCustomEmojiItem,
  dedupeCustomEmojis,
  getEmojiSrc,
} from "./helpers";
import type { EmojiItem, EmojiCategory } from "./types";

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
  const isSearching = debouncedQuery.length > 0;

  const categories = useMemo(() => {
    if (!emojiData) return [];

    const result: EmojiCategory[] = [];
    const query = debouncedQuery;
    const normalizedCustomEmojis = dedupeCustomEmojis(customEmojis);

    // --- Recent category ---
    if (!query && recentKeys.length > 0) {
      const standardMap = new Map<string, EmojiItem>();
      for (const cat of emojiData.categories) {
        for (const item of cat.emojis) {
          if (item.emoji) standardMap.set(item.emoji, item);
        }
      }
      const customMap = new Map<string, EmojiItem>();
      if (normalizedCustomEmojis.length > 0) {
        for (const [index, ce] of normalizedCustomEmojis.entries()) {
          customMap.set(`:${ce.shortcode}:`, createCustomEmojiItem(ce, index));
        }
      }

      const recentItems: EmojiItem[] = [];
      const seen = new Set<string>();
      for (const key of recentKeys) {
        const standard = standardMap.get(key);
        if (standard) {
          if (seen.has(standard.key)) continue;
          seen.add(standard.key);
          recentItems.push(standard);
          continue;
        }
        const custom = customMap.get(key);
        if (custom) {
          if (seen.has(custom.key)) continue;
          seen.add(custom.key);
          recentItems.push(custom);
        }
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
    if (normalizedCustomEmojis.length > 0) {
      const items: EmojiItem[] = normalizedCustomEmojis.map((ce, index) =>
        createCustomEmojiItem(ce, index),
      );

      const filtered = query
        ? items.filter((item) => item.searchText.includes(query))
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
        ? cat.emojis.filter((item) => item.searchText.includes(query))
        : cat.emojis;

      if (filtered.length === 0) continue;

      // Apply skin tone without re-parsing the same emoji on every render.
      const resolved = filtered.map((item) => {
        const resolvedEmoji =
          skinTone !== 0 && item.emoji ? resolveEmoji(item, skinTone) : item.emoji;

        if (!resolvedEmoji || resolvedEmoji === item.emoji) {
          return item;
        }

        return {
          ...item,
          key: `standard:${resolvedEmoji}`,
          emoji: resolvedEmoji,
          src: getEmojiSrc(resolvedEmoji),
        };
      });

      result.push({ ...cat, emojis: resolved });
    }

    return result;
  }, [emojiData, customEmojis, recentKeys, skinTone, debouncedQuery]);

  return {
    categories,
    isLoading: emojiLoading,
    isEmpty: !emojiLoading && categories.length === 0,
    isSearching,
  };
}
