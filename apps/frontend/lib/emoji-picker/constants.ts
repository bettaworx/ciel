import {
  Clock4,
  Hash,
  Smile,
  Hand,
  Cat,
  Apple,
  Volleyball,
  Car,
  Lightbulb,
  Music2,
  Flag,
  type LucideIcon,
} from "lucide-react";

export const EMOJIBASE_CDN =
  "https://cdn.jsdelivr.net/npm/emojibase-data@latest";

// ---------------------------------------------------------------------------
// Twemoji CDN — pinned to match @twemoji/parser@16.0.0
// ---------------------------------------------------------------------------

const TWEMOJI_VERSION = "16.0.1";
const TWEMOJI_CDN_BASE = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg/`;

export function buildTwemojiUrl(codepoints: string): string {
  return `${TWEMOJI_CDN_BASE}${codepoints}.svg`;
}

/**
 * Mapping from emojibase group order numbers to category metadata.
 * Order values come from emojibase messages.json `groups[].order`:
 *   0: smileys-emotion, 1: people-body, 2: component (excluded),
 *   3: animals-nature, 4: food-drink, 5: travel-places,
 *   6: activities, 7: objects, 8: symbols, 9: flags
 */
export const CATEGORY_META: Record<
  number,
  { id: string; icon: LucideIcon }
> = {
  0: { id: "smileys-emotion", icon: Smile },
  1: { id: "people-body", icon: Hand },
  3: { id: "animals-nature", icon: Cat },
  4: { id: "food-drink", icon: Apple },
  5: { id: "travel-places", icon: Car },
  6: { id: "activities", icon: Volleyball },
  7: { id: "objects", icon: Lightbulb },
  8: { id: "symbols", icon: Music2 },
  9: { id: "flags", icon: Flag },
};

export const RECENT_CATEGORY_ICON = Clock4;
export const CUSTOM_CATEGORY_ICON = Hash;

export const SKIN_TONE_OPTIONS = [
  { value: 0, labelKey: "default", sample: "\u{1F44B}", color: "#ffdc5d" },
  { value: 1, labelKey: "light", sample: "\u{1F44B}\u{1F3FB}", color: "#f7dece" },
  { value: 2, labelKey: "mediumLight", sample: "\u{1F44B}\u{1F3FC}", color: "#f3d2a2" },
  { value: 3, labelKey: "medium", sample: "\u{1F44B}\u{1F3FD}", color: "#d4ab88" },
  { value: 4, labelKey: "mediumDark", sample: "\u{1F44B}\u{1F3FE}", color: "#af7e57" },
  { value: 5, labelKey: "dark", sample: "\u{1F44B}\u{1F3FF}", color: "#7c533e" },
] as const;
