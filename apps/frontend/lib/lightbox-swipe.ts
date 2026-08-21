/**
 * Pure swipe-gesture math for the Lightbox.
 *
 * Lives outside the component so it can be unit tested: `vitest.config.ts`
 * only picks up `**\/*.test.ts`, never `.tsx`.
 */

export type SwipeIntent = "none" | "prev" | "next" | "dismiss";

export interface SwipeInput {
  /** Total pointer travel since gesture start, in px. */
  dx: number;
  dy: number;
  /** Release velocity in px/ms. */
  vx: number;
  vy: number;
  /** Stage dimensions in px. */
  width: number;
  height: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/** Fraction of the stage width a horizontal drag must cross to commit. */
const HORIZONTAL_RATIO = 0.25;
/** Fraction of the stage height a downward drag must cross to dismiss. */
const VERTICAL_RATIO = 0.2;
/**
 * Absolute ceilings on those fractions. A ratio alone scales with the stage,
 * so on a 1920px desktop a page would need a 480px drag — unusable with a
 * mouse — while a phone needs only ~100px.
 */
const MAX_HORIZONTAL_PX = 120;
const MAX_VERTICAL_PX = 160;
/** Flick speed (px/ms) that commits regardless of distance. */
const FLICK_VELOCITY = 0.5;

/** Distance a drag must cover on this axis before it commits. */
export function commitDistance(
  extent: number,
  ratio: number,
  ceiling: number,
): number {
  return Math.min(extent * ratio, ceiling);
}

/** Which axis the gesture is committed to, or null if it is still ambiguous. */
export function swipeAxis(dx: number, dy: number): "x" | "y" | null {
  if (dx === 0 && dy === 0) return null;
  return Math.abs(dx) > Math.abs(dy) ? "x" : "y";
}

/**
 * Decide what a released swipe should do. A flick only counts when its
 * direction agrees with the travel, so dragging one way and flicking back
 * cancels instead of committing to the wrong neighbour.
 */
export function resolveSwipe({
  dx,
  dy,
  vx,
  vy,
  width,
  height,
  hasPrev,
  hasNext,
}: SwipeInput): SwipeIntent {
  if (swipeAxis(dx, dy) === "x") {
    const flicked = Math.abs(vx) > FLICK_VELOCITY && Math.sign(vx) === Math.sign(dx);
    const needed = commitDistance(width, HORIZONTAL_RATIO, MAX_HORIZONTAL_PX);
    if (Math.abs(dx) <= needed && !flicked) return "none";
    if (dx > 0) return hasPrev ? "prev" : "none";
    return hasNext ? "next" : "none";
  }

  // Only downward swipes dismiss; upward does nothing.
  if (dy <= 0) return "none";
  const needed = commitDistance(height, VERTICAL_RATIO, MAX_VERTICAL_PX);
  return dy > needed || vy > FLICK_VELOCITY ? "dismiss" : "none";
}

/** Progress of an in-flight dismiss drag, 0..1 — drives backdrop fade and shrink. */
export function dismissProgress(dy: number, height: number): number {
  if (dy <= 0 || height <= 0) return 0;
  return Math.min(1, dy / height);
}

/** Resistance applied when dragging toward an edge that has no neighbour. */
export function rubberBand(delta: number): number {
  return delta * 0.3;
}
