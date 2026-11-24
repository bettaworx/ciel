import { describe, expect, it } from "vitest";
import {
  carouselEdges,
  carouselItemRatio,
  carouselSnapPoints,
  carouselStepTarget,
  GRID_CELLS,
} from "./layout";

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

describe("carouselSnapPoints", () => {
  // Five 300px slides with 4px gaps in a 600px track: max scroll = 1516 - 600.
  const slides = [0, 304, 608, 912, 1216].map((start) => ({ start, width: 300 }));

  it("centres middle slides and keeps the end slides flush with the edges", () => {
    // Centring slide 0 would need -150 and slide 4 would need 1066: both clamp.
    expect(carouselSnapPoints(slides, 600, 916)).toEqual([0, 154, 458, 762, 916]);
  });

  it("still rests the end slides flush when a slide is exactly as wide as the track", () => {
    // A phone: 290px track, slides capped at 290px by their CSS max-width.
    const full = [0, 294, 588, 882, 1176].map((start) => ({ start, width: 290 }));
    expect(carouselSnapPoints(full, 290, 1176)).toEqual([0, 294, 588, 882, 1176]);
  });

  it("gives narrow end slides the same clamped point", () => {
    const narrow = [0, 104, 208, 312, 416].map((start) => ({ start, width: 100 }));
    // 516px of slides in a 300px track: max 216.
    expect(carouselSnapPoints(narrow, 300, 216)).toEqual([0, 4, 108, 212, 216]);
    const tiny = [0, 54, 108, 162, 216].map((start) => ({ start, width: 50 }));
    expect(carouselSnapPoints(tiny, 200, 66)).toEqual([0, 0, 33, 66, 66]);
  });
});

describe("carouselStepTarget", () => {
  const points = [0, 154, 458, 762, 916];

  it("moves exactly one slide per press, both ways", () => {
    expect(carouselStepTarget(points, 0, 1)).toBe(154);
    expect(carouselStepTarget(points, 154, 1)).toBe(458);
    expect(carouselStepTarget(points, 762, 1)).toBe(916);
    expect(carouselStepTarget(points, 916, -1)).toBe(762);
    expect(carouselStepTarget(points, 154, -1)).toBe(0);
  });

  it("stays put at either end", () => {
    expect(carouselStepTarget(points, 916, 1)).toBe(916);
    expect(carouselStepTarget(points, 0, -1)).toBe(0);
  });

  it("counts from an in-flight target, so a quick second press goes one further", () => {
    // First press from 0 heads for 154; the second press must not re-pick 154.
    const first = carouselStepTarget(points, 0, 1);
    expect(carouselStepTarget(points, first, 1)).toBe(458);
  });

  it("from between slides, goes to the neighbouring rest point", () => {
    expect(carouselStepTarget(points, 300, 1)).toBe(458);
    expect(carouselStepTarget(points, 300, -1)).toBe(154);
  });

  it("passes over slides sharing a clamped end point, and ignores sub-pixel drift", () => {
    expect(carouselStepTarget([0, 0, 33, 66, 66], 0, 1)).toBe(33);
    expect(carouselStepTarget([0, 0, 33, 66, 66], 66, -1)).toBe(33);
    expect(carouselStepTarget(points, 153.6, 1)).toBe(458);
    expect(carouselStepTarget(points, 154.4, -1)).toBe(0);
  });
});

describe("carouselEdges", () => {
  it("reports either end, with sub-pixel slack", () => {
    expect(carouselEdges(0, 916)).toEqual({ atStart: true, atEnd: false });
    expect(carouselEdges(400, 916)).toEqual({ atStart: false, atEnd: false });
    expect(carouselEdges(915.5, 916)).toEqual({ atStart: false, atEnd: true });
  });

  it("is at both ends when nothing overflows", () => {
    expect(carouselEdges(0, 0)).toEqual({ atStart: true, atEnd: true });
  });
});
