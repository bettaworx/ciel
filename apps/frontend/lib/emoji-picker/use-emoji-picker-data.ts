"use client";

import { useDeferredValue, useMemo } from "react";
import { useEmojiData, resolveEmoji } from "./use-emoji-data";
import { useCustomEmojis } from "@/lib/hooks/use-queries";
import {
  useRecentEmojis,
  useEmojiSkinTone,
  normalizeRecentEmojis,
} from "@/atoms/emoji-picker";
import {
  RECENT_CATEGORY_ICON,
  CUSTOM_CATEGORY_ICON,
} from "./constants";
import {
  getEmojiSrc,
} from "./helpers";
import type { EmojiItem, EmojiCategory } from "./types";
import { buildEmojiSearchDataset, searchEmojiDataset } from "./search";

function resolveEmojiItemTone(item: EmojiItem, skinTone: number): EmojiItem {
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
}

// ---------------------------------------------------------------------------
// Build the unified category list
// ---------------------------------------------------------------------------

export function useEmojiPickerData(searchQuery: string) {
  const { data: emojiData, isLoading: emojiLoading } = useEmojiData();
  const { data: customEmojis } = useCustomEmojis();
  const recentKeys = normalizeRecentEmojis(useRecentEmojis());
  const skinTone = useEmojiSkinTone();

  const debouncedQuery = useDeferredValue(searchQuery.trim().toLowerCase());
  const isSearching = debouncedQuery.length > 0;
  const searchDataset = useMemo(() => {
    if (!emojiData) return null;
    return buildEmojiSearchDataset(emojiData.categories, customEmojis);
  }, [emojiData, customEmojis]);

  const categories = useMemo(() => {
    if (!emojiData || !searchDataset) return [];

    const result: EmojiCategory[] = [];
    const query = debouncedQuery;

    // --- Recent category ---
    if (!query && recentKeys.length > 0) {
      const recentItems: EmojiItem[] = [];
      const seen = new Set<string>();
      for (const key of recentKeys) {
        const item = searchDataset.recentLookup.get(key);
        if (item) {
          if (seen.has(item.key)) continue;
          seen.add(item.key);
          recentItems.push(resolveEmojiItemTone(item, skinTone));
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

    if (query) {
      const searchResults = searchEmojiDataset(searchDataset, query).map((item) =>
        resolveEmojiItemTone(item, skinTone),
      );

      if (searchResults.length > 0) {
        result.push({
          id: "search-results",
          label: "Search Results",
          icon: CUSTOM_CATEGORY_ICON,
          emojis: searchResults,
        });
      }

      return result;
    }

    // --- Custom category ---
    if (searchDataset.customItems.length > 0) {
      result.push({
        id: "custom",
        label: "Custom",
        labelKey: "custom",
        icon: CUSTOM_CATEGORY_ICON,
        emojis: searchDataset.customItems,
      });
    }

    // --- Standard categories ---
    for (const cat of emojiData.categories) {
      const resolved = cat.emojis.map((item) => resolveEmojiItemTone(item, skinTone));

      result.push({ ...cat, emojis: resolved });
    }

    return result;
  }, [emojiData, recentKeys, skinTone, debouncedQuery, searchDataset]);

  return {
    categories,
    isLoading: emojiLoading,
    isEmpty: !emojiLoading && categories.length === 0,
    isSearching,
  };
}
