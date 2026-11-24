import type { UseEmblaCarouselType } from "embla-carousel-react";

type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;

/**
 * A mouse wheel moves in notches of ~100px. Embla's WheelGesturesPlugin reads
 * one as a short drag and snaps straight back to the slide it started from, so
 * a notch has to turn the slide itself. A trackpad sends a stream of small or
 * fractional deltas instead, and is left to that plugin.
 *
 * A notch is a whole-pixel delta of NOTCH_MIN_PX or more. A big delta in the
 * middle of a trackpad stream (a fast flick) still belongs to the trackpad:
 * anything within FINE_GAP_MS of a fine delta counts as trackpad.
 */
export const NOTCH_MIN_PX = 40;
export const FINE_GAP_MS = 150;

/** One detector per carousel: it remembers when the last fine delta arrived. */
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

/**
 * Embla plugin turning each sideways mouse-wheel notch into a one-slide step.
 * It listens in the capture phase on the viewport, so a notch it takes never
 * reaches WheelGesturesPlugin. `enabled` lets a caller pause it (the lightbox,
 * while zoomed).
 */
export function WheelNotchPlugin(enabled: () => boolean = () => true) {
  let root: HTMLElement | null = null;
  let onWheel: ((event: WheelEvent) => void) | null = null;
  return {
    name: "wheelNotch",
    options: {},
    init(embla: EmblaApi) {
      const isNotch = createNotchDetector();
      const node = embla.rootNode();
      const listener = (event: WheelEvent) => {
        const dx = event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX;
        if (Math.abs(dx) <= Math.abs(event.deltaY)) return;
        if (!isNotch(dx, event.timeStamp) || !enabled()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (dx > 0) embla.scrollNext();
        else embla.scrollPrev();
      };
      node.addEventListener("wheel", listener, { capture: true, passive: false });
      root = node;
      onWheel = listener;
    },
    destroy() {
      if (root && onWheel) root.removeEventListener("wheel", onWheel, { capture: true });
      root = null;
      onWheel = null;
    },
  };
}
