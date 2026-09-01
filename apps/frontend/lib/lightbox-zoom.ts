/**
 * Pure zoom/pan math for the Lightbox.
 *
 * Lives outside the component so it can be unit tested: `vitest.config.ts`
 * only picks up `**\/*.test.ts`, never `.tsx`.
 */

/** Clamp a scale into the usable range. Below 1 the image no longer fits. */
export function clampScale(value: number, max: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(max, 1), Math.max(1, value));
}

/**
 * Furthest the content can travel on one axis at `scale`.
 *
 * framer-motion's `scale` transforms about the element centre, so the content
 * grows symmetrically and the reachable range is ±extent(scale-1)/2. (The old
 * react-zoom-pan-pinch implementation used a top-left origin, where the range
 * was extent(1-scale)..0 — that asymmetry is the easiest thing to get wrong
 * when porting, hence the tests.)
 */
export function panLimit(extent: number, scale: number): number {
  if (scale <= 1 || extent <= 0) return 0;
  return (extent * (scale - 1)) / 2;
}

/** Keep a pan offset within the bounds implied by `scale`. */
export function clampPan(value: number, extent: number, scale: number): number {
  const limit = panLimit(extent, scale);
  return Math.min(limit, Math.max(-limit, value));
}

/**
 * New pan offset that keeps the content point under `cursor` in place while
 * the scale changes. `cursor` is measured from the element's centre, matching
 * the transform origin.
 */
export function anchorPan(
  cursor: number,
  pan: number,
  scale: number,
  nextScale: number,
): number {
  if (scale <= 0) return pan;
  return cursor - (cursor - pan) * (nextScale / scale);
}
