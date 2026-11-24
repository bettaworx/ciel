import { describe, expect, it } from "vitest";
import { PullToRefreshGesture } from "@/lib/pull-to-refresh";

const point = (clientX: number, clientY: number, identifier = 1) => ({
  clientX,
  clientY,
  identifier,
});

function startGesture() {
  const gesture = new PullToRefreshGesture();
  gesture.start([point(100, 100)], 0);
  return gesture;
}

describe("pull-to-refresh gesture", () => {
  it("damps a downward pull and refreshes once at the threshold", () => {
    const gesture = startGesture();
    gesture.move([point(100, 260)], 0, 150);
    expect(gesture.distance).toBe(80);
    expect(gesture.release(80)).toBe(true);
    expect(gesture.distance).toBe(0);
    expect(gesture.release(80)).toBe(false);
  });

  it("caps the indicator distance", () => {
    const gesture = startGesture();
    gesture.move([point(100, 1000)], 0, 150);
    expect(gesture.distance).toBe(150);
  });

  it("does not show the indicator for tap jitter", () => {
    const gesture = startGesture();
    gesture.move([point(102, 103)], 0, 150);
    expect(gesture.distance).toBe(0);
    expect(gesture.release(80)).toBe(false);
  });

  it("does not refresh below the threshold or after dragging back", () => {
    const gesture = startGesture();
    gesture.move([point(100, 300)], 0, 150);
    gesture.move([point(100, 120)], 0, 150);
    expect(gesture.distance).toBe(10);
    expect(gesture.release(80)).toBe(false);
  });

  it.each([
    ["upward scrolling", point(100, 90)],
    ["horizontal swiping", point(150, 110)],
    ["diagonal swiping", point(150, 150)],
  ])("leaves %s to the browser for the rest of the gesture", (_, touch) => {
    const gesture = startGesture();
    gesture.move([touch], 0, 150);
    gesture.move([point(100, 400)], 0, 150);
    expect(gesture.distance).toBe(0);
    expect(gesture.release(80)).toBe(false);
  });

  it("does not arm partway through scrolling to the top", () => {
    const gesture = new PullToRefreshGesture();
    gesture.start([point(100, 100)], 100);
    gesture.move([point(100, 400)], 0, 150);
    expect(gesture.distance).toBe(0);
    expect(gesture.release(80)).toBe(false);
  });

  it("cancels if the page starts scrolling during a pull", () => {
    const gesture = startGesture();
    gesture.move([point(100, 400)], 0, 150);
    gesture.move([point(100, 450)], 1, 150);
    expect(gesture.distance).toBe(0);
    expect(gesture.release(80)).toBe(false);
  });

  it("allows negative scroll offsets from elastic overscroll", () => {
    const gesture = new PullToRefreshGesture();
    gesture.start([point(100, 100)], -1);
    gesture.move([point(100, 300)], -10, 150);
    expect(gesture.release(80)).toBe(true);
  });

  it.each([
    ["no fingers", []],
    ["multiple fingers", [point(100, 400), point(120, 400, 2)]],
    ["a different finger", [point(100, 400, 2)]],
  ])("cancels when a move has %s", (_, touches) => {
    const gesture = startGesture();
    gesture.move([point(100, 300)], 0, 150);
    gesture.move(touches, 0, 150);
    expect(gesture.distance).toBe(0);
    expect(gesture.release(80)).toBe(false);
  });

  it("ignores a pinch from the start even after one finger is lifted", () => {
    const gesture = new PullToRefreshGesture();
    gesture.start([point(100, 100), point(120, 100, 2)], 0);
    gesture.move([point(100, 400)], 0, 150);
    expect(gesture.release(80)).toBe(false);
  });

  it("cancels an armed pull without refreshing and allows the next gesture", () => {
    const gesture = startGesture();
    gesture.move([point(100, 400)], 0, 150);
    gesture.cancel();
    expect(gesture.distance).toBe(0);
    expect(gesture.release(80)).toBe(false);
    gesture.start([point(100, 100)], 0);
    gesture.move([point(100, 300)], 0, 150);
    expect(gesture.release(80)).toBe(true);
  });
});
