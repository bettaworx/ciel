import { describe, expect, it } from "vitest";
import type { PublicEmoji } from "@/lib/custom-emojis";
import {
  applyEmojiSuggestion,
  getCustomEmojiSuggestions,
  getEmojiSuggestionMatch,
} from "@/lib/emoji-suggestions";

const emojis: PublicEmoji[] = [
  {
    shortcode: "blobcat",
    imageUrl: "https://example.com/blobcat.webp",
    name: "Blob Cat",
    category: null,
    license: null,
  },
  {
    shortcode: "blobby",
    imageUrl: "https://example.com/blobby.webp",
    name: "Blobby",
    category: null,
    license: null,
  },
  {
    shortcode: "catjam",
    imageUrl: "https://example.com/catjam.webp",
    name: "Cat Jam",
    category: null,
    license: null,
  },
];

describe("emoji suggestions", () => {
  it("detects an in-progress shortcode query at the caret", () => {
    expect(getEmojiSuggestionMatch("hello :bl", 9)).toEqual({
      query: "bl",
      start: 6,
      end: 9,
    });
  });

  it("ignores completed or invalid shortcode fragments", () => {
    expect(getEmojiSuggestionMatch(":blobcat:", 8)).toBeNull();
    expect(getEmojiSuggestionMatch("word:bl", 7)).toBeNull();
    expect(getEmojiSuggestionMatch("::bl", 4)).toBeNull();
  });

  it("prioritizes shortcode prefix matches", () => {
    expect(getCustomEmojiSuggestions(emojis, "bl").map((emoji) => emoji.shortcode)).toEqual([
      "blobby",
      "blobcat",
    ]);
  });

  it("replaces the active shortcode fragment with a completed emoji code", () => {
    const match = getEmojiSuggestionMatch("hello :bl world", 9);
    expect(match).not.toBeNull();
    expect(applyEmojiSuggestion("hello :bl world", match!, "blobcat")).toEqual({
      nextValue: "hello :blobcat: world",
      caret: 15,
    });
  });
});
