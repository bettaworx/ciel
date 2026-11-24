import { describe, expect, it } from "vitest";
import { carouselItemRatio, GRID_CELLS } from "./layout";

describe("GRID_CELLS", () => {
  it("has one cell per attachment for 2-4", () => {
    for (const count of [2, 3, 4] as const) expect(GRID_CELLS[count]).toHaveLength(count);
  });
});

describe("carouselItemRatio", () => {
  it("keeps ordinary shapes as they are", () => {
    expect(carouselItemRatio(800, 600, "image")).toBeCloseTo(4 / 3);
    expect(carouselItemRatio(600, 800, "image")).toBeCloseTo(3 / 4);
    expect(carouselItemRatio(500, 500, "video")).toBe(1);
    expect(carouselItemRatio(1000, 900, "image")).toBeCloseTo(1000 / 900);
  });

  it("caps landscape media at 4:3, images and videos alike", () => {
    expect(carouselItemRatio(3000, 1000, "image")).toBeCloseTo(4 / 3);
    expect(carouselItemRatio(3000, 1000, "video")).toBeCloseTo(4 / 3);
  });

  it("leaves portrait images uncapped, however tall", () => {
    expect(carouselItemRatio(1000, 3000, "image")).toBeCloseTo(1 / 3);
    expect(carouselItemRatio(100, 2000, "image")).toBeCloseTo(1 / 20);
  });

  it("keeps portrait videos at 3:4 or wider", () => {
    expect(carouselItemRatio(1000, 3000, "video")).toBeCloseTo(3 / 4);
  });

  it("falls back to square without dimensions", () => {
    expect(carouselItemRatio(0, 600, "image")).toBe(1);
    expect(carouselItemRatio(null, undefined, "video")).toBe(1);
  });
});
