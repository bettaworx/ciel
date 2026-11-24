import { describe, expect, it } from "vitest";
import { anchorPan, clampPan, clampScale, panLimit } from "./lightbox-zoom";

describe("clampScale", () => {
  it("never goes below 1 — the image always at least fits", () => {
    expect(clampScale(0.2, 4)).toBe(1);
    expect(clampScale(-3, 4)).toBe(1);
  });

  it("caps at max", () => {
    expect(clampScale(9, 4)).toBe(4);
    expect(clampScale(2.5, 4)).toBe(2.5);
  });

  it("survives a max below 1 without inverting the range", () => {
    expect(clampScale(3, 0.5)).toBe(1);
  });

  it("falls back to 1 on NaN", () => {
    expect(clampScale(Number.NaN, 4)).toBe(1);
  });
});

describe("panLimit", () => {
  it("is 0 at fit — there is nowhere to pan", () => {
    expect(panLimit(800, 1)).toBe(0);
    expect(panLimit(800, 0.5)).toBe(0);
  });

  it("is half the overflow, because scaling is about the centre", () => {
    // 800px wide at 2x = 1600px, 800px of overflow, 400px each side.
    expect(panLimit(800, 2)).toBe(400);
    expect(panLimit(800, 1.5)).toBe(200);
  });

  it("is 0 before the stage is measured", () => {
    expect(panLimit(0, 3)).toBe(0);
  });
});

describe("clampPan", () => {
  it("passes values inside the bounds through", () => {
    expect(clampPan(150, 800, 2)).toBe(150);
  });

  it("clamps both directions symmetrically", () => {
    expect(clampPan(9999, 800, 2)).toBe(400);
    expect(clampPan(-9999, 800, 2)).toBe(-400);
    expect(clampPan(-500, 800, 2)).toBe(-clampPan(500, 800, 2));
  });

  it("pins to centre when the image only fits", () => {
    expect(clampPan(120, 800, 1)).toBe(0);
  });
});

describe("anchorPan", () => {
  it("keeps the centre fixed when zooming from centre", () => {
    expect(anchorPan(0, 0, 1, 3)).toBe(0);
  });

  it("pushes content away from the anchored point as it grows", () => {
    // Doubling around a point 100px right of centre moves the pan to -100,
    // so that same content point stays under the cursor.
    expect(anchorPan(100, 0, 1, 2)).toBe(-100);
  });

  it("round-trips: zoom in then back out restores the original pan", () => {
    const zoomedIn = anchorPan(120, 40, 1, 2.5);
    expect(anchorPan(120, zoomedIn, 2.5, 1)).toBeCloseTo(40);
  });

  it("leaves the pan alone on a degenerate scale", () => {
    expect(anchorPan(50, 12, 0, 2)).toBe(12);
  });
});
