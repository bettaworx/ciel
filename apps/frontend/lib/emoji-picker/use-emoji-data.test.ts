import { describe, expect, it } from "vitest";

import {
  buildStandardEmojiCategories,
  normalizeEmojibaseLocale,
  type EmojibaseDataBundle,
} from "./use-emoji-data";

const bundle: EmojibaseDataBundle = {
  locale: "ja",
  messages: {
    groups: [
      { key: "smileys-emotion", message: "スマイリーと感情", order: 0 },
      { key: "people-body", message: "人体", order: 1 },
      { key: "component", message: "コンポーネント", order: 2 },
    ],
    skinTones: [],
  },
  emojis: [
    {
      emoji: "😀",
      label: "にっこり笑う",
      tags: ["スマイル", "笑顔"],
      group: 0,
      subgroup: 0,
    },
    {
      emoji: "👋",
      label: "手を振る",
      group: 1,
      subgroup: 0,
      skins: [{ tone: 1, emoji: "👋🏻" }],
    },
    {
      emoji: "🏻",
      label: "明るい肌のトーン",
      group: 2,
      subgroup: 0,
    },
    {
      emoji: "A",
      label: "Letter A",
      group: 0,
      subgroup: 0,
    },
  ],
};

describe("emojibase data helpers", () => {
  it("normalizes unsupported locales to the app default locale", () => {
    expect(normalizeEmojibaseLocale("en-US")).toBe("en");
    expect(normalizeEmojibaseLocale("fr")).toBe("ja");
    expect(normalizeEmojibaseLocale(null)).toBe("ja");
  });

  it("builds localized standard emoji categories from emojibase data", () => {
    const categories = buildStandardEmojiCategories(bundle);

    expect(categories.map((category) => category.label)).toEqual([
      "スマイリーと感情",
      "人体",
    ]);
    expect(categories[0].emojis.map((emoji) => emoji.label)).toEqual([
      "にっこり笑う",
    ]);
    expect(categories[0].emojis[0].searchText).toContain("スマイル");
    expect(categories[1].emojis[0].skins).toEqual([{ tone: 1, emoji: "👋🏻" }]);
  });

  it("excludes component entries and values Twemoji cannot render as one emoji", () => {
    const categories = buildStandardEmojiCategories(bundle);
    const allItems = categories.flatMap((category) => category.emojis);

    expect(allItems.map((emoji) => emoji.emoji)).toEqual(["😀", "👋"]);
  });
});
