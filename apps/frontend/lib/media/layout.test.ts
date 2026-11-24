import { describe, expect, it } from "vitest";
import { lightboxIndices, mediaGridLayout } from "./layout";

describe("mediaGridLayout", () => {
  it("keeps the 2-4 layouts on two columns", () => {
    for (const count of [2, 3, 4]) {
      const layout = mediaGridLayout(count);
      expect(layout.columns).toBe(2);
      expect(layout.cells).toHaveLength(count);
    }
    expect(mediaGridLayout(3).cells[0]).toContain("row-span-2");
  });

  it("gives every one of 5-20 attachments its own cell on three columns", () => {
    expect(mediaGridLayout(5)).toMatchObject({ columns: 3, ratio: "3 / 2" });
    const twenty = mediaGridLayout(20);
    expect(twenty.cells).toHaveLength(20);
    expect(twenty.ratio).toBe("3 / 7");
  });
});

describe("lightboxIndices", () => {
  it("numbers images only, skipping videos", () => {
    expect(lightboxIndices(["video", "image", "image", "video", "image"])).toEqual([
      null,
      0,
      1,
      null,
      2,
    ]);
  });
});
