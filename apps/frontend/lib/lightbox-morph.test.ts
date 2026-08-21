import { describe, expect, it } from "vitest";
import {
  containRect,
  containsPoint,
  transformRect,
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

const IDENTITY = {
  dragX: 0,
  dragY: 0,
  stageScale: 1,
  panX: 0,
  panY: 0,
  zoom: 1,
};
const CENTRE = { x: 500, y: 300 };

describe("transformRect", () => {
  it("is a no-op at rest", () => {
    const base: Rect = { x: 100, y: 50, width: 400, height: 300 };
    expect(transformRect(base, IDENTITY, CENTRE)).toEqual(base);
  });

  it("leaves a centred rect centred while the dismiss shrinks it", () => {
    // A rect centred on the origin must stay centred: scaling is about `centre`.
    const base: Rect = { x: 300, y: 200, width: 400, height: 200 };
    const r = transformRect(base, { ...IDENTITY, stageScale: 0.6 }, CENTRE);
    expect(r.width).toBeCloseTo(240);
    expect(r.height).toBeCloseTo(120);
    expect(r.x + r.width / 2).toBeCloseTo(CENTRE.x);
    expect(r.y + r.height / 2).toBeCloseTo(CENTRE.y);
  });

  it("applies the drag after the scale, like the CSS transform does", () => {
    const base: Rect = { x: 300, y: 200, width: 400, height: 200 };
    const r = transformRect(
      { ...base },
      { ...IDENTITY, stageScale: 0.5, dragX: 100, dragY: -40 },
      CENTRE,
    );
    // Centre lands at centre*1 + drag, not (centre + drag) * scale.
    expect(r.x + r.width / 2).toBeCloseTo(CENTRE.x + 100);
    expect(r.y + r.height / 2).toBeCloseTo(CENTRE.y - 40);
  });

  it("compounds the zoom layer inside the swipe layer", () => {
    const base: Rect = { x: 300, y: 200, width: 400, height: 200 };
    const r = transformRect(
      base,
      { ...IDENTITY, zoom: 2, panX: 30, stageScale: 0.5 },
      CENTRE,
    );
    expect(r.width).toBeCloseTo(400);
    expect(r.height).toBeCloseTo(200);
    // pan is applied in zoom-layer space, so the swipe scale halves it.
    expect(r.x + r.width / 2).toBeCloseTo(CENTRE.x + 15);
  });
});

describe("containsPoint", () => {
  // The <img> element is `h-full w-full`, so it covers the whole stage while
  // `object-contain` paints only a letterboxed slice of it. Hit testing has to
  // use the painted rect, not the element.
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
