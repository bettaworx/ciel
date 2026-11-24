import { describe, expect, it } from "vitest";
import { commitDistance, dismissProgress, shouldDismiss, swipeAxis } from "./lightbox-swipe";

const release = (over: Partial<{ dy: number; vy: number; height: number }>) =>
  shouldDismiss({ dy: 0, vy: 0, height: 800, ...over });

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

describe("shouldDismiss", () => {
  it("dismisses when dragged down past the threshold", () => {
    expect(release({ dy: 200 })).toBe(true); // 800 * 0.2 = 160
  });

  it("does nothing below the threshold", () => {
    expect(release({ dy: 100 })).toBe(false);
  });

  it("dismisses on a downward flick", () => {
    expect(release({ dy: 40, vy: 0.8 })).toBe(true);
  });

  it("dismisses on a tall stage without a full-height drag", () => {
    expect(release({ dy: 200, height: 1400 })).toBe(true);
  });

  it("dismisses upward on the same threshold", () => {
    expect(release({ dy: -200 })).toBe(true);
    expect(release({ dy: -100 })).toBe(false);
  });

  it("dismisses on an upward flick", () => {
    expect(release({ dy: -40, vy: -0.8 })).toBe(true);
  });

  it("ignores a flick that disagrees with the travel", () => {
    expect(release({ dy: 40, vy: -0.8 })).toBe(false);
    expect(release({ dy: -40, vy: 0.8 })).toBe(false);
  });

  it("does nothing when the pointer never moved", () => {
    expect(release({})).toBe(false);
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
