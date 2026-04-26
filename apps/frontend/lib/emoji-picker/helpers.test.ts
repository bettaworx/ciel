import { describe, expect, it } from "vitest";

import type { PublicEmoji } from "@/lib/custom-emojis";
import {
  buildEmojiSearchText,
  createCustomEmojiItem,
  dedupeCustomEmojis,
} from "./helpers";

describe("emoji picker helpers", () => {
  it("dedupes custom emojis by shortcode while preserving first occurrence", () => {
    const emojis: PublicEmoji[] = [
      {
        shortcode: "ban",
        name: "Ban Hammer",
        imageUrl: "https://example.com/ban-1.png",
        category: null,
        license: null,
      },
      {
        shortcode: "ban",
        name: "Duplicate Ban",
        imageUrl: "https://example.com/ban-2.png",
        category: null,
        license: null,
      },
      {
        shortcode: "blobcat",
        name: "Blob Cat",
        imageUrl: "https://example.com/blobcat.png",
        category: null,
        license: null,
      },
    ];

    expect(dedupeCustomEmojis(emojis).map((emoji) => emoji.imageUrl)).toEqual([
      "https://example.com/ban-1.png",
      "https://example.com/blobcat.png",
    ]);
  });

  it("builds stable searchable custom emoji items", () => {
    const item = createCustomEmojiItem(
      {
        shortcode: "ban",
        name: "Ban Hammer",
        imageUrl: "https://example.com/ban.png",
        category: null,
        license: null,
      },
      0,
    );

    expect(item.key).toBe("custom:ban:0");
    expect(item.searchText).toBe(buildEmojiSearchText("Ban Hammer", "ban"));
    expect(item.src).toBe("https://example.com/ban.png");
  });
});
