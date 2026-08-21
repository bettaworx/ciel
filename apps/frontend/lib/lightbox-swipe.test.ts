import { describe, expect, it } from "vitest";
import {
  commitDistance,
  dismissProgress,
  resolveSwipe,
  rubberBand,
  swipeAxis,
  type SwipeInput,
} from "./lightbox-swipe";

const base: SwipeInput = {
  dx: 0,
  dy: 0,
  vx: 0,
  vy: 0,
  width: 400,
  height: 800,
  hasPrev: true,
  hasNext: true,
};

const swipe = (over: Partial<SwipeInput>) => resolveSwipe({ ...base, ...over });

describe("swipeAxis", () => {
  it("returns null when there is no travel", () => {
    expect(swipeAxis(0, 0)).toBeNull();
  });

  it("picks the dominant axis, favouring vertical on a tie", () => {
    expect(swipeAxis(30, 10)).toBe("x");
    expect(swipeAxis(-30, 10)).toBe("x");
    expect(swipeAxis(10, 30)).toBe("y");
    expect(swipeAxis(20, 20)).toBe("y");
  });
});

describe("commitDistance", () => {
  it("uses the ratio on a narrow stage", () => {
    expect(commitDistance(400, 0.25, 120)).toBe(100);
  });

  it("caps on a wide one, so a desktop drag stays reachable", () => {
    expect(commitDistance(1920, 0.25, 120)).toBe(120);
  });
});

describe("resolveSwipe — horizontal", () => {
  it("does nothing below the distance threshold", () => {
    expect(swipe({ dx: 90, dy: 5 })).toBe("none"); // 400 * 0.25 = 100
  });

  it("goes to the previous item when dragged right past the threshold", () => {
    expect(swipe({ dx: 120, dy: 5 })).toBe("prev");
  });

  it("goes to the next item when dragged left past the threshold", () => {
    expect(swipe({ dx: -120, dy: 5 })).toBe("next");
  });

  it("commits on a short flick", () => {
    expect(swipe({ dx: -30, dy: 5, vx: -0.9 })).toBe("next");
  });

  it("cancels when the flick direction disagrees with the travel", () => {
    expect(swipe({ dx: -30, dy: 5, vx: 0.9 })).toBe("none");
  });

  it("pages on a desktop-width stage without a 480px drag", () => {
    expect(swipe({ dx: -140, dy: 5, width: 1920 })).toBe("next");
    expect(swipe({ dx: -90, dy: 5, width: 1920 })).toBe("none");
  });

  it("stays put at the edges", () => {
    expect(swipe({ dx: 120, dy: 5, hasPrev: false })).toBe("none");
    expect(swipe({ dx: -120, dy: 5, hasNext: false })).toBe("none");
  });
});

describe("resolveSwipe — vertical", () => {
  it("dismisses when dragged down past the threshold", () => {
    expect(swipe({ dx: 5, dy: 200 })).toBe("dismiss"); // 800 * 0.2 = 160
  });

  it("does nothing below the threshold", () => {
    expect(swipe({ dx: 5, dy: 100 })).toBe("none");
  });

  it("dismisses on a downward flick", () => {
    expect(swipe({ dx: 5, dy: 40, vy: 0.8 })).toBe("dismiss");
  });

  it("dismisses on a tall stage without a full-height drag", () => {
    expect(swipe({ dx: 5, dy: 200, height: 1400 })).toBe("dismiss");
  });

  it("dismisses upward on the same threshold", () => {
    expect(swipe({ dx: 5, dy: -200 })).toBe("dismiss");
    expect(swipe({ dx: 5, dy: -100 })).toBe("none");
  });

  it("dismisses on an upward flick", () => {
    expect(swipe({ dx: 5, dy: -40, vy: -0.8 })).toBe("dismiss");
  });

  it("ignores a flick that disagrees with the travel", () => {
    expect(swipe({ dx: 5, dy: 40, vy: -0.8 })).toBe("none");
    expect(swipe({ dx: 5, dy: -40, vy: 0.8 })).toBe("none");
  });

  it("does nothing when the pointer never moved", () => {
    expect(swipe({})).toBe("none");
  });
});

describe("dismissProgress", () => {
  it("is 0 only when the pointer has not moved", () => {
    expect(dismissProgress(0, 800)).toBe(0);
  });

  it("treats upward travel like downward", () => {
    expect(dismissProgress(-400, 800)).toBe(0.5);
    expect(dismissProgress(-1200, 800)).toBe(1);
  });

  it("scales linearly and clamps at 1", () => {
    expect(dismissProgress(400, 800)).toBe(0.5);
    expect(dismissProgress(1200, 800)).toBe(1);
  });

  it("is 0 rather than NaN before the stage is measured", () => {
    expect(dismissProgress(100, 0)).toBe(0);
  });
});

describe("rubberBand", () => {
  it("damps travel and keeps its sign", () => {
    expect(rubberBand(100)).toBeCloseTo(30);
    expect(rubberBand(-100)).toBeCloseTo(-30);
  });
});
