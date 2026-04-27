import { Hash, Smile } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  buildSectionLayouts,
  findActiveCategoryId,
  getGridHeight,
  getGridWidth,
  type EmojiPickerLayoutMetrics,
} from "./layout";
import type { EmojiCategory } from "./types";

const metrics: EmojiPickerLayoutMetrics = {
  cellSize: 32,
  rowGap: 2,
  columnGap: 2,
  gridPaddingX: 4,
  headerHeight: 44,
  sectionSpacing: 4,
};

const categories: EmojiCategory[] = [
  {
    id: "smileys-emotion",
    label: "Smileys & Emotion",
    icon: Smile,
    emojis: Array.from({ length: 10 }, (_, index) => ({
      key: `standard:${index}`,
      type: "standard",
      emoji: "😀",
      label: `emoji-${index}`,
      searchText: `emoji-${index}`,
      src: "https://example.com/emoji.svg",
    })),
  },
  {
    id: "symbols",
    label: "Symbols",
    icon: Hash,
    emojis: Array.from({ length: 3 }, (_, index) => ({
      key: `custom:${index}`,
      type: "custom",
      shortcode: `symbol-${index}`,
      label: `symbol-${index}`,
      searchText: `symbol-${index}`,
      src: "https://example.com/custom.png",
    })),
  },
];

describe("emoji picker layout helpers", () => {
  it("computes grid width and height from fixed metrics", () => {
    expect(getGridWidth(9, metrics)).toBe(288);
    expect(getGridHeight(10, 9, metrics)).toBe(64);
    expect(getGridHeight(3, 9, metrics)).toBe(32);
  });

  it("builds section layouts with stable offsets", () => {
    const layouts = buildSectionLayouts(categories, 9, metrics);

    expect(layouts).toEqual([
      {
        id: "smileys-emotion",
        rowCount: 2,
        gridHeight: 64,
        sectionHeight: 112,
        offsetTop: 0,
      },
      {
        id: "symbols",
        rowCount: 1,
        gridHeight: 32,
        sectionHeight: 76,
        offsetTop: 112,
      },
    ]);
  });

  it("resolves the active category from scroll position", () => {
    const layouts = buildSectionLayouts(categories, 9, metrics);

    expect(findActiveCategoryId(layouts, 0, 280, 44)).toBe("smileys-emotion");
    expect(findActiveCategoryId(layouts, 40, 280, 44)).toBe("symbols");
    expect(findActiveCategoryId(layouts, 70, 280, 44)).toBe("symbols");
    expect(findActiveCategoryId(layouts, 140, 280, 44)).toBe("symbols");
  });

  it("returns an empty active category when there are no sections", () => {
    expect(findActiveCategoryId([], 0, 280, 44)).toBe("");
  });
});
