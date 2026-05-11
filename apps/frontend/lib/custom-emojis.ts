import type { components } from "@/lib/api/api";

export type PublicEmoji = components["schemas"]["PublicEmoji"];

const CUSTOM_EMOJI_PATTERN = /^:([\w+-]+(?:@[\w.-]+)?):$/;

export function isCustomEmojiShortcode(value: string): boolean {
  return CUSTOM_EMOJI_PATTERN.test(value.trim());
}

export function normalizeCustomEmojiShortcode(value: string): string {
  const trimmed = value.trim();
  const matched = CUSTOM_EMOJI_PATTERN.exec(trimmed);
  if (matched) {
    return matched[1];
  }
  return trimmed.replace(/^:+|:+$/g, "");
}

export function buildCustomEmojiMap(
  emojis: PublicEmoji[] | undefined,
): Map<string, PublicEmoji> {
  return new Map((emojis ?? []).map((emoji) => [emoji.shortcode, emoji]));
}

export function resolveCustomEmoji(
  emojis: PublicEmoji[] | undefined,
  shortcode: string,
): PublicEmoji | undefined {
  const normalized = normalizeCustomEmojiShortcode(shortcode);
  if (!normalized || normalized.includes("@")) {
    return undefined;
  }
  return buildCustomEmojiMap(emojis).get(normalized);
}

export function formatCustomEmojiFallback(shortcode: string): string {
  const normalized = normalizeCustomEmojiShortcode(shortcode);
  return normalized ? `:${normalized}:` : shortcode;
}
