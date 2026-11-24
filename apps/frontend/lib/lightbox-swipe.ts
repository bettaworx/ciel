/**
 * Pure swipe-gesture math for the Lightbox's own gestures: the vertical drag
 * that dismisses it. Sideways paging is Embla's.
 *
 * Lives outside the component so it can be unit tested: `vitest.config.ts`
 * only picks up `**\/*.test.ts`, never `.tsx`.
 */

/** Fraction of the stage height a vertical drag must cross to dismiss. */
const VERTICAL_RATIO = 0.2;
/**
 * Absolute ceiling on that fraction. A ratio alone scales with the stage, so a
 * tall desktop window would need a long drag while a phone needs only ~100px.
 */
const MAX_VERTICAL_PX = 160;
/** Flick speed (px/ms) that dismisses regardless of distance. */
const FLICK_VELOCITY = 0.5;

/** Distance a drag must cover along an axis before it commits. */
export function commitDistance(extent: number, ratio: number, ceiling: number): number {
  return Math.min(extent * ratio, ceiling);
}

/** Which axis the gesture is committed to, or null if it is still ambiguous. */
export function swipeAxis(dx: number, dy: number): "x" | "y" | null {
  if (dx === 0 && dy === 0) return null;
  return Math.abs(dx) > Math.abs(dy) ? "x" : "y";
}

/**
 * Whether a released vertical drag dismisses the lightbox. Either direction
 * counts. A flick only counts when it agrees with the travel, so dragging one
 * way and flicking back cancels instead of closing.
 */
export function shouldDismiss({ dy, vy, height }: { dy: number; vy: number; height: number }) {
  const flicked = Math.abs(vy) > FLICK_VELOCITY && Math.sign(vy) === Math.sign(dy);
  return Math.abs(dy) > commitDistance(height, VERTICAL_RATIO, MAX_VERTICAL_PX) || flicked;
}

/**
 * Progress of an in-flight dismiss drag, 0..1 — drives backdrop fade and
 * shrink. Direction-agnostic: dragging up dismisses just like dragging down.
 */
export function dismissProgress(dy: number, height: number): number {
  if (height <= 0) return 0;
  return Math.min(1, Math.abs(dy) / height);
}
