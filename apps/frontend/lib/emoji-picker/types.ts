import type { LucideIcon } from "lucide-react";

/** Unified emoji item for both standard Unicode and custom server emojis. */
export interface EmojiItem {
  type: "standard" | "custom";
  /** Unicode codepoint string (standard emojis only). */
  emoji?: string;
  /** Display name / label. */
  label: string;
  /** Emojibase group number (standard emojis only). */
  group?: number;
  /** Skin tone variants (standard emojis only). */
  skins?: Array<{ tone: number | number[]; emoji: string }>;
  /** Shortcode without colons (custom emojis only). */
  shortcode?: string;
  /** Image URL (custom emojis only). */
  imageUrl?: string;
  /**
   * Pre-computed image source URL.
   * Set by use-emoji-picker-data so that the render path never calls parseTwemoji.
   */
  src?: string | null;
}

/** A grouped category of emojis. */
export interface EmojiCategory {
  id: string;
  /** Display label (from emojibase, in English). */
  label: string;
  /**
   * Optional i18n key within the "emojiPicker" namespace.
   * When set, the component resolves the translated label instead of `label`.
   */
  labelKey?: string;
  icon: LucideIcon;
  emojis: EmojiItem[];
}

/** Event emitted when an emoji is selected. */
export interface EmojiSelectEvent {
  /** Unicode string (standard) or `:shortcode:` (custom). */
  emoji: string;
  type: "standard" | "custom";
  /** Only present for custom emojis. */
  shortcode?: string;
}
