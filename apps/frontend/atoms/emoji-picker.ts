"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

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

const MAX_RECENT = 32;

export const recentEmojisAtom = atomWithStorage<string[]>(
  "ciel-recent-emojis",
  [],
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
  const next = [emoji, ...prev.filter((e) => e !== emoji)];
  return next.slice(0, MAX_RECENT);
}
