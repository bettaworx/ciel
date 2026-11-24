import { describe, expect, it } from "vitest";
import { createNotchDetector, FINE_GAP_MS } from "./wheel-notch";

describe("createNotchDetector", () => {
  it("takes whole-pixel deltas of a mouse wheel as notches", () => {
    const isNotch = createNotchDetector();
    expect(isNotch(100, 0)).toBe(true);
    expect(isNotch(-100, 40)).toBe(true);
    expect(isNotch(48, 400)).toBe(true); // 3 lines of 16px
  });

  it("measures in device pixels, so scaled screens still see notches", () => {
    const isNotch = createNotchDetector();
    // A 100px notch at 150% and 300% scaling, reported in CSS pixels.
    expect(isNotch(100 / 1.5, 0, 1.5)).toBe(true);
    expect(isNotch(100 / 3, 400, 3)).toBe(true);
    // A fractional trackpad delta stays fractional in device pixels.
    expect(isNotch(57.3333, 800, 1)).toBe(false);
  });

  it("leaves a trackpad's small and fractional deltas alone", () => {
    const isNotch = createNotchDetector();
    expect(isNotch(3, 0)).toBe(false);
    expect(isNotch(12.5, 16)).toBe(false);
    expect(isNotch(57.3333, 32)).toBe(false);
  });

  it("keeps a big delta inside a trackpad stream with the trackpad", () => {
    const isNotch = createNotchDetector();
    isNotch(8, 0);
    isNotch(20, 16);
    expect(isNotch(120, 32)).toBe(false);
    // Once the trackpad has been quiet for a while, a notch is a notch again.
    expect(isNotch(100, 32 + FINE_GAP_MS + 1)).toBe(true);
  });
});
