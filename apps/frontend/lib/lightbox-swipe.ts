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
/** Fraction of the stage height a vertical drag must cross to dismiss. */
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

  // Either direction dismisses. As on the horizontal axis, a flick only counts
  // when it agrees with the travel, so dragging one way and flicking back
  // cancels instead of committing.
  const flicked =
    Math.abs(vy) > FLICK_VELOCITY && Math.sign(vy) === Math.sign(dy);
  const needed = commitDistance(height, VERTICAL_RATIO, MAX_VERTICAL_PX);
  return Math.abs(dy) > needed || flicked ? "dismiss" : "none";
}

/**
 * Progress of an in-flight dismiss drag, 0..1 — drives backdrop fade and
 * shrink. Direction-agnostic: dragging up dismisses just like dragging down.
 */
export function dismissProgress(dy: number, height: number): number {
  if (height <= 0) return 0;
  return Math.min(1, Math.abs(dy) / height);
}

/** Resistance applied when dragging toward an edge that has no neighbour. */
export function rubberBand(delta: number): number {
  return delta * 0.3;
}
