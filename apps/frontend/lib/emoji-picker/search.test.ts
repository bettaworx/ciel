import { describe, expect, it } from "vitest";
import { Hash, Smile } from "lucide-react";

import type { PublicEmoji } from "@/lib/custom-emojis";
import type { EmojiCategory } from "./types";
import { buildEmojiSearchDataset, searchEmojiDataset } from "./search";

const standardCategories: EmojiCategory[] = [
  {
    id: "smileys-emotion",
    label: "Smileys & Emotion",
    icon: Smile,
    emojis: [
      {
        key: "standard:😀",
        type: "standard",
        emoji: "😀",
        label: "Grinning Face",
        searchText: "grinning face",
        src: "https://example.com/grinning.svg",
      },
      {
        key: "standard:😂",
        type: "standard",
        emoji: "😂",
        label: "Face with Tears of Joy",
        searchText: "face with tears of joy",
        src: "https://example.com/joy.svg",
      },
      {
        key: "standard:😊",
        type: "standard",
        emoji: "😊",
        label: "にこにこ",
        searchText: "にこにこ スマイル",
        src: "https://example.com/smile.svg",
      },
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: Hash,
    emojis: [
      {
        key: "standard:✅",
        type: "standard",
        emoji: "✅",
        label: "Check Mark Button",
        searchText: "check mark button",
        src: "https://example.com/check.svg",
      },
    ],
  },
];

const customEmojis: PublicEmoji[] = [
  {
    shortcode: "blobcat_wave",
    name: "Blobcat Wave",
    imageUrl: "https://example.com/blobcat-wave.png",
    category: null,
    license: null,
  },
  {
    shortcode: "party_blob",
    name: "Party Blob",
    imageUrl: "https://example.com/party-blob.png",
    category: null,
    license: null,
  },
];

describe("emoji picker search dataset", () => {
  it("finds standard emojis by substring", () => {
    const dataset = buildEmojiSearchDataset(standardCategories, customEmojis);

    expect(searchEmojiDataset(dataset, "tears").map((item) => item.key)).toEqual([
      "standard:😂",
    ]);
  });

  it("finds custom emojis by name and shortcode", () => {
    const dataset = buildEmojiSearchDataset(standardCategories, customEmojis);

    expect(searchEmojiDataset(dataset, "blobcat").map((item) => item.key)).toEqual([
      "custom:blobcat_wave:0",
    ]);
    expect(searchEmojiDataset(dataset, "party_b").map((item) => item.key)).toEqual([
      "custom:party_blob:1",
    ]);
  });

  it("preserves the existing category order in search results", () => {
    const dataset = buildEmojiSearchDataset(standardCategories, customEmojis);

    expect(searchEmojiDataset(dataset, "face").map((item) => item.key)).toEqual([
      "standard:😀",
      "standard:😂",
    ]);
  });

  it("finds standard emojis by localized search text", () => {
    const dataset = buildEmojiSearchDataset(standardCategories, customEmojis);

    expect(searchEmojiDataset(dataset, "スマイル").map((item) => item.key)).toEqual([
      "standard:😊",
    ]);
  });

  it("builds recent lookup without a synthetic recent category", () => {
    const dataset = buildEmojiSearchDataset(standardCategories, customEmojis);

    expect(dataset.recentLookup.get("😀")?.key).toBe("standard:😀");
    expect(dataset.recentLookup.get(":blobcat_wave:")?.key).toBe("custom:blobcat_wave:0");
    expect(searchEmojiDataset(dataset, "recently used")).toEqual([]);
  });
});
