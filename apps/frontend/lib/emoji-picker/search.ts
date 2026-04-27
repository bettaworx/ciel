"use client";

import { Index } from "flexsearch";

import { createCustomEmojiItem, dedupeCustomEmojis } from "./helpers";
import type { EmojiCategory, EmojiItem } from "./types";
import type { PublicEmoji } from "@/lib/custom-emojis";

export interface EmojiSearchEntry {
  id: string;
  order: number;
  categoryId: string;
  item: EmojiItem;
}

export interface EmojiSearchDataset {
  customItems: EmojiItem[];
  entryMap: Map<string, EmojiSearchEntry>;
  index: Index;
  recentLookup: Map<string, EmojiItem>;
}

function buildRecentLookup(
  standardCategories: EmojiCategory[],
  customItems: EmojiItem[],
): Map<string, EmojiItem> {
  const lookup = new Map<string, EmojiItem>();

  for (const category of standardCategories) {
    for (const item of category.emojis) {
      if (item.emoji) {
        lookup.set(item.emoji, item);
      }
    }
  }

  for (const item of customItems) {
    if (item.shortcode) {
      lookup.set(`:${item.shortcode}:`, item);
    }
  }

  return lookup;
}

export function buildEmojiSearchDataset(
  standardCategories: EmojiCategory[],
  customEmojis: PublicEmoji[] | undefined,
): EmojiSearchDataset {
  const customItems = dedupeCustomEmojis(customEmojis).map((emoji, index) =>
    createCustomEmojiItem(emoji, index),
  );
  const entryMap = new Map<string, EmojiSearchEntry>();
  const index = new Index({
    tokenize: "full",
    encoder: "Default",
    cache: true,
  });
  let order = 0;

  for (const item of customItems) {
    const entry: EmojiSearchEntry = {
      id: `search:${item.key}`,
      order,
      categoryId: "custom",
      item,
    };
    entryMap.set(entry.id, entry);
    index.add(entry.id, item.searchText);
    order += 1;
  }

  for (const category of standardCategories) {
    for (const item of category.emojis) {
      const entry: EmojiSearchEntry = {
        id: `search:${item.key}`,
        order,
        categoryId: category.id,
        item,
      };
      entryMap.set(entry.id, entry);
      index.add(entry.id, item.searchText);
      order += 1;
    }
  }

  return {
    customItems,
    entryMap,
    index,
    recentLookup: buildRecentLookup(standardCategories, customItems),
  };
}

export function searchEmojiDataset(
  dataset: EmojiSearchDataset,
  rawQuery: string,
): EmojiItem[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return [];
  }

  return dataset.index
    .search(query)
    .map((id) => dataset.entryMap.get(String(id)))
    .filter((entry): entry is EmojiSearchEntry => {
      return Boolean(entry && entry.item.searchText.includes(query));
    })
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.item);
}
