import { describe, expect, it } from "vitest";
import {
  boxGeometry,
  containRect,
  containsPoint,
  type Rect,
} from "./lightbox-morph";

const BOX: Rect = { x: 8, y: 8, width: 984, height: 584 };

describe("containRect", () => {
  it("fills the width and centres vertically for a wide image", () => {
    const r = containRect(1968, 984, BOX);
    expect(r.width).toBe(984);
    expect(r.height).toBe(492);
    expect(r.x).toBe(8);
    expect(r.y).toBe(8 + (584 - 492) / 2);
  });

  it("fills the height and centres horizontally for a tall image", () => {
    const r = containRect(292, 584, BOX);
    expect(r.height).toBe(584);
    expect(r.width).toBe(292);
    expect(r.y).toBe(8);
    expect(r.x).toBe(8 + (984 - 292) / 2);
  });

  it("scales a small image up, matching object-contain", () => {
    const r = containRect(100, 100, BOX);
    expect(r.width).toBe(584);
    expect(r.height).toBe(584);
  });

  it("falls back to the box on a degenerate natural size", () => {
    expect(containRect(0, 100, BOX)).toEqual(BOX);
  });
});

describe("boxGeometry", () => {
  const CENTRE = { x: 500, y: 300 };

  it("is all zeros for a rect already centred", () => {
    expect(boxGeometry({ x: 300, y: 200, width: 400, height: 200 }, CENTRE)).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 200,
    });
  });

  it("offsets by the gap between the two centres", () => {
    // A thumbnail up and to the left of the stage centre.
    expect(boxGeometry({ x: 100, y: 50, width: 200, height: 100 }, CENTRE)).toEqual({
      x: 200 - 500,
      y: 100 - 300,
      width: 200,
      height: 100,
    });
  });

  it("round-trips a fitted rect back to the resting position", () => {
    const fitted = containRect(1968, 984, BOX);
    const centre = { x: BOX.x + BOX.width / 2, y: BOX.y + BOX.height / 2 };
    const geom = boxGeometry(fitted, centre);
    expect(geom.x).toBeCloseTo(0);
    expect(geom.y).toBeCloseTo(0);
  });
});

describe("containsPoint", () => {
  // The <img> fills its box, but during the morph that box is the thumbnail
  // rect, and at rest the painted rect is what a tap has to be tested against.
  const painted = containRect(1968, 984, BOX);

  it("accepts a point on the image", () => {
    expect(containsPoint(painted, 500, 300)).toBe(true);
  });

  it("rejects the letterbox above and below", () => {
    expect(containsPoint(painted, 500, 20)).toBe(false);
    expect(containsPoint(painted, 500, 580)).toBe(false);
  });

  it("includes the edges", () => {
    expect(containsPoint(painted, painted.x, painted.y)).toBe(true);
    expect(
      containsPoint(painted, painted.x + painted.width, painted.y + painted.height),
    ).toBe(true);
  });
});
