import { describe, expect, it } from "vitest";
import {
  buildCustomEmojiMap,
  formatCustomEmojiFallback,
  isCustomEmojiShortcode,
  normalizeCustomEmojiShortcode,
  resolveCustomEmoji,
  type PublicEmoji,
} from "@/lib/custom-emojis";

const emojis: PublicEmoji[] = [
  {
    shortcode: "blobcat",
    imageUrl: "https://example.com/blobcat.webp",
    name: "Blob Cat",
    category: null,
    license: null,
  },
];

describe("custom emoji helpers", () => {
  it("detects custom emoji shortcode format", () => {
    expect(isCustomEmojiShortcode(":blobcat:")).toBe(true);
    expect(isCustomEmojiShortcode("blobcat")).toBe(false);
    expect(isCustomEmojiShortcode(":blobcat@example.com:")).toBe(true);
  });

  it("normalizes colon-wrapped shortcodes", () => {
    expect(normalizeCustomEmojiShortcode(":blobcat:")).toBe("blobcat");
    expect(normalizeCustomEmojiShortcode("blobcat")).toBe("blobcat");
  });

  it("builds a map indexed by shortcode", () => {
    const emojiMap = buildCustomEmojiMap(emojis);
    expect(emojiMap.get("blobcat")?.imageUrl).toBe(
      "https://example.com/blobcat.webp",
    );
  });

  it("resolves local custom emoji and ignores remote shortcodes", () => {
    expect(resolveCustomEmoji(emojis, ":blobcat:")?.shortcode).toBe("blobcat");
    expect(resolveCustomEmoji(emojis, ":blobcat@example.com:")).toBeUndefined();
  });

  it("formats shortcode fallback text", () => {
    expect(formatCustomEmojiFallback("blobcat")).toBe(":blobcat:");
    expect(formatCustomEmojiFallback(":blobcat:")).toBe(":blobcat:");
  });
});
