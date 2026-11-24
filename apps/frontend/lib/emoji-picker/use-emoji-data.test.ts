import { describe, expect, it } from "vitest";

import { DEFAULT_RECENT_EMOJIS } from "@/atoms/emoji-picker";
import { normalizeTwemojiEmoji } from "./helpers";
import {
  buildStandardEmojiCategories,
  loadEmojibaseData,
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
      emoji: "©️",
      label: "著作権",
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
      emoji: "👍️",
      label: "サムズアップ",
      group: 1,
      subgroup: 0,
    },
    {
      emoji: "❓️",
      label: "赤い疑問符",
      group: 1,
      subgroup: 0,
    },
    {
      emoji: "❌️",
      label: "バツ",
      group: 1,
      subgroup: 0,
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

    expect(categories.map((category) => category.label)).toEqual(["スマイリーと感情", "人体"]);
    expect(categories[0].emojis.map((emoji) => emoji.label)).toEqual(["にっこり笑う", "著作権"]);
    expect(categories[0].emojis[0].searchText).toContain("スマイル");
    expect(categories[1].emojis[0].skins).toEqual([{ tone: 1, emoji: "👋🏻" }]);
  });

  it("excludes component entries and values Twemoji cannot render as one emoji", () => {
    const categories = buildStandardEmojiCategories(bundle);
    const allItems = categories.flatMap((category) => category.emojis);

    expect(allItems.map((emoji) => emoji.emoji)).toEqual(["😀", "©️", "👋", "👍", "❓", "❌"]);
  });
});

/**
 * Reactions are matched by exact string on the client and the server, so the
 * string the picker emits for an emoji is part of the stored data. These run
 * against the bundled emojibase release, so an upgrade that spells an emoji
 * differently fails here instead of splitting reaction counts.
 */
describe.each(["ja", "en"])("picker emoji from the bundled emojibase data (%s)", (locale) => {
  const emitted = (bundle: EmojibaseDataBundle) =>
    buildStandardEmojiCategories(bundle).flatMap((category) =>
      category.emojis.map((item) => item.emoji),
    );

  it("gives every emoji a unique key", async () => {
    const items = buildStandardEmojiCategories(await loadEmojibaseData(locale)).flatMap(
      (category) => category.emojis,
    );

    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
  });

  it("emits the same strings whether or not the data spells FE0F", async () => {
    // emojibase 18 dropped the FE0F that 17 carried on emoji such as ☕ and ⭕.
    // Stripping it from every single character that Twemoji draws bare stands
    // in for a release that spells them differently again.
    const bundle = await loadEmojibaseData(locale);
    const stripped = {
      ...bundle,
      emojis: bundle.emojis.map((entry) => {
        const bare = entry.emoji.replace(/\uFE0F/g, "");
        const drawnBare = [...bare].length === 1 && normalizeTwemojiEmoji(bare) !== null;
        return drawnBare ? { ...entry, emoji: bare } : entry;
      }),
    };

    expect(emitted(stripped)).toEqual(emitted(bundle));
  });

  it("emits the strings already stored for reactions", async () => {
    const strings = new Set(emitted(await loadEmojibaseData(locale)));

    // The defaults of the recent row, plus emoji whose spelling changed in
    // emojibase 18. Existing reactions were stored in these forms.
    for (const emoji of [
      ...DEFAULT_RECENT_EMOJIS,
      "☕\uFE0F",
      "⭐\uFE0F",
      "⚡\uFE0F",
      "⚽\uFE0F",
      "♈\uFE0F",
      "🫰",
      "👍",
    ]) {
      expect(strings.has(emoji), emoji).toBe(true);
    }
  });
});
