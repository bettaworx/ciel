import { parse as parseTwemoji } from "@twemoji/parser";

import type { PublicEmoji } from "@/lib/custom-emojis";
import {
  buildTwemojiUrl,
  type TwemojiAssetType,
} from "./constants";
import type { EmojiItem } from "./types";

const emojiSrcCache = new Map<string, string | null>();
const twemojiEmojiCache = new Map<string, boolean>();

export function isSingleTwemojiEmoji(emoji: string): boolean {
  const cached = twemojiEmojiCache.get(emoji);
  if (cached !== undefined) {
    return cached;
  }

  const entries = parseTwemoji(emoji, {
    buildUrl: (codepoints) => buildTwemojiUrl(codepoints, "svg"),
    assetType: "svg",
  });
  const valid = entries.length === 1;
  twemojiEmojiCache.set(emoji, valid);
  return valid;
}

export function getEmojiSrc(
  emoji: string,
  assetType: TwemojiAssetType = "svg",
): string | null {
  const cacheKey = `${assetType}:${emoji}`;
  const cached = emojiSrcCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const entries = parseTwemoji(emoji, {
    buildUrl: (codepoints) => buildTwemojiUrl(codepoints, assetType),
    assetType,
  });
  const src = entries.length === 1 ? entries[0].url : null;
  emojiSrcCache.set(cacheKey, src);
  return src;
}

export function buildEmojiSearchText(label: string, shortcode?: string): string {
  return `${label} ${shortcode ?? ""}`.trim().toLowerCase();
}

export function createCustomEmojiItem(
  emoji: PublicEmoji,
  index: number,
): EmojiItem {
  const label = emoji.name || emoji.shortcode;

  return {
    key: `custom:${emoji.shortcode}:${index}`,
    type: "custom",
    label,
    searchText: buildEmojiSearchText(label, emoji.shortcode),
    shortcode: emoji.shortcode,
    imageUrl: emoji.imageUrl,
    src: emoji.imageUrl ?? null,
  };
}

export function dedupeCustomEmojis(
  emojis: PublicEmoji[] | undefined,
): PublicEmoji[] {
  if (!emojis || emojis.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const deduped: PublicEmoji[] = [];

  for (const emoji of emojis) {
    if (seen.has(emoji.shortcode)) {
      continue;
    }
    seen.add(emoji.shortcode);
    deduped.push(emoji);
  }

  return deduped;
}
