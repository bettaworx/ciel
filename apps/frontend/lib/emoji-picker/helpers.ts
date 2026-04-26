import { parse as parseTwemoji } from "@twemoji/parser";

import type { PublicEmoji } from "@/lib/custom-emojis";
import { buildTwemojiUrl } from "./constants";
import type { EmojiItem } from "./types";

const emojiSrcCache = new Map<string, string | null>();

export function getEmojiSrc(emoji: string): string | null {
  const cached = emojiSrcCache.get(emoji);
  if (cached !== undefined) {
    return cached;
  }

  const entries = parseTwemoji(emoji, {
    buildUrl: buildTwemojiUrl,
    assetType: "svg",
  });
  const src = entries.length === 1 ? entries[0].url : null;
  emojiSrcCache.set(emoji, src);
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
