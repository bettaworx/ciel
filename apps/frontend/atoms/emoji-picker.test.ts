import { describe, expect, it } from "vitest";

import {
  addRecentEmoji,
  DEFAULT_RECENT_EMOJIS,
  MAX_RECENT,
  normalizeRecentEmojiKey,
  normalizeRecentEmojis,
} from "@/atoms/emoji-picker";

describe("emoji-picker recent emojis", () => {
  it("falls back to the default recent emojis when storage is empty", () => {
    expect(normalizeRecentEmojis([])).toEqual(DEFAULT_RECENT_EMOJIS);
  });

  it("deduplicates and truncates the recent list", () => {
    const duplicated = ["👍", "🔥", "👍", "😂", "🔥", "😭"];

    expect(normalizeRecentEmojis(duplicated)).toEqual(["👍", "🔥", "😂", "😭"]);
  });

  it("normalizes text-presentation glyphs to emoji-presentation keys", () => {
    expect(normalizeRecentEmojiKey("❤")).toBe("❤️");
    expect(normalizeRecentEmojiKey("✔")).toBe("✅");
    expect(normalizeRecentEmojiKey("✅")).toBe("✅");
    expect(normalizeRecentEmojiKey("❗")).toBe("❗️");
    expect(normalizeRecentEmojiKey("?")).toBe("❓");
    expect(normalizeRecentEmojiKey("❓️")).toBe("❓");
    expect(normalizeRecentEmojiKey("⭕")).toBe("⭕️");
    expect(normalizeRecentEmojiKey("✖")).toBe("❌");
    expect(normalizeRecentEmojiKey("❌")).toBe("❌");
    expect(normalizeRecentEmojiKey("❌️")).toBe("❌");
  });

  it("adds a new emoji to the front using defaults as the baseline", () => {
    const next = addRecentEmoji([], "🎉");

    expect(next[0]).toBe("🎉");
    expect(next.slice(1)).toEqual(
      DEFAULT_RECENT_EMOJIS.filter((emoji) => emoji !== "🎉").slice(0, MAX_RECENT - 1),
    );
  });

  it("keeps the recent list within the configured maximum", () => {
    const seeded = Array.from({ length: MAX_RECENT }, (_, index) => `:${index}:`);

    const next = addRecentEmoji(seeded, ":new:");

    expect(next).toHaveLength(MAX_RECENT);
    expect(next[0]).toBe(":new:");
    expect(next).not.toContain(`:${MAX_RECENT - 1}:`);
  });
});
