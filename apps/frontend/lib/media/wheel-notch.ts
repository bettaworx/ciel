/**
 * Tells a mouse wheel's notches apart from a trackpad's fine scrolling, for the
 * sideways-scrolling media strips (the carousel and the lightbox).
 *
 * A trackpad scrolls natively and snaps by itself, and that is left alone. A
 * mouse wheel (shift + wheel, or a tilt wheel) moves in notches of ~100px,
 * which the browser snaps straight back to the item it started from, so a
 * notch has to turn one item itself.
 *
 * A notch is a whole-pixel delta of NOTCH_MIN_PX or more. A trackpad sends a
 * stream of small or fractional deltas, and a big one in the middle of that
 * stream (a fast flick) still belongs to the trackpad: anything within
 * FINE_GAP_MS of a fine delta counts as trackpad.
 */
export const NOTCH_MIN_PX = 40;
export const FINE_GAP_MS = 150;

/** One detector per strip: it remembers when the last fine delta arrived. */
export function createNotchDetector() {
  let fineUntil = -Infinity;
  return (dx: number, now: number): boolean => {
    const notchSized = Math.abs(dx) >= NOTCH_MIN_PX && Number.isInteger(dx);
    if (!notchSized) {
      fineUntil = now + FINE_GAP_MS;
      return false;
    }
    return now > fineUntil;
  };
}
