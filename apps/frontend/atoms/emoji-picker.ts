"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { getEmojiSrc } from "@/lib/emoji-picker/helpers";

// ---------------------------------------------------------------------------
// Skin tone preference (0 = default, 1-5 = light to dark)
// ---------------------------------------------------------------------------

export const emojiSkinToneAtom = atomWithStorage<number>(
  "ciel-emoji-skin-tone",
  0,
);

export function useEmojiSkinTone() {
  return useAtomValue(emojiSkinToneAtom);
}

export function useSetEmojiSkinTone() {
  return useSetAtom(emojiSkinToneAtom);
}

// ---------------------------------------------------------------------------
// Recently used emojis (unicode strings or ":shortcode:" for custom)
// ---------------------------------------------------------------------------

export const MAX_RECENT = 40;

export const DEFAULT_RECENT_EMOJIS = [
  "❤️",
  "👍",
  "👌",
  "👋",
  "🙏",
  "🔥",
  "👀",
  "😂",
  "😭",
  "🤯",
  "🤔",
  "✔️",
  "🆗",
  "❗️",
  "❓",
  "⁉️",
  "⭕️",
  "✖️",
] as const;

const RECENT_EMOJI_CANONICAL_MAP: Record<string, string> = {
  "❤": "❤️",
  "✔": "✔️",
  "✅": "✔️",
  "❗": "❗️",
  "?": "❓",
  "⭕": "⭕️",
  "✖": "✖️",
  "❌": "✖️",
};

export function normalizeRecentEmojiKey(emoji: string): string {
  if (!emoji || (emoji.startsWith(":") && emoji.endsWith(":"))) {
    return emoji;
  }

  const canonical = RECENT_EMOJI_CANONICAL_MAP[emoji];
  if (canonical) {
    return canonical;
  }

  if (getEmojiSrc(emoji)) {
    return emoji;
  }

  const withoutVariationSelectors = emoji.replace(/\uFE0F/g, "");
  const canonicalWithoutVariationSelectors =
    RECENT_EMOJI_CANONICAL_MAP[withoutVariationSelectors];
  if (canonicalWithoutVariationSelectors) {
    return canonicalWithoutVariationSelectors;
  }

  if (getEmojiSrc(withoutVariationSelectors)) {
    return withoutVariationSelectors;
  }

  const withEmojiPresentation = `${withoutVariationSelectors}\uFE0F`;
  if (getEmojiSrc(withEmojiPresentation)) {
    return withEmojiPresentation;
  }

  return emoji;
}

export function normalizeRecentEmojis(recentEmojis: readonly string[]): string[] {
  const source = recentEmojis.length > 0 ? recentEmojis : DEFAULT_RECENT_EMOJIS;
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const emoji of source) {
    const normalized = normalizeRecentEmojiKey(emoji);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(normalized);
    if (deduped.length >= MAX_RECENT) break;
  }

  return deduped;
}

export const recentEmojisAtom = atomWithStorage<string[]>(
  "ciel-recent-emojis",
  normalizeRecentEmojis([]),
);

export function useRecentEmojis() {
  return useAtomValue(recentEmojisAtom);
}

export function useSetRecentEmojis() {
  return useSetAtom(recentEmojisAtom);
}

/** Push an emoji to the front of the recent list, deduplicating. */
export function addRecentEmoji(
  prev: string[],
  emoji: string,
): string[] {
  const current = normalizeRecentEmojis(prev);
  const next = [emoji, ...current.filter((e) => e !== emoji)];
  return next.slice(0, MAX_RECENT);
}
