/**
 * Pure rectangle math for the Lightbox open/close morph.
 *
 * Lives outside the component for the same reason as `lightbox-zoom.ts`:
 * `vitest.config.ts` only picks up `**\/*.test.ts`, never `.tsx`.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where an `object-contain` image actually paints inside `box`.
 *
 * Contain scales up as well as down, so `scale` is deliberately not capped at
 * 1 — a small image fills the stage exactly like the real <img> does.
 */
export function containRect(natW: number, natH: number, box: Rect): Rect {
  if (natW <= 0 || natH <= 0) return box;
  const scale = Math.min(box.width / natW, box.height / natH);
  const width = natW * scale;
  const height = natH * scale;
  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) / 2,
    width,
    height,
  };
}

/** Whether a viewport point falls inside `rect`. */
export function containsPoint(rect: Rect, x: number, y: number): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

/**
 * A viewport rect expressed as the image box's own `x/y/width/height`.
 *
 * The box is flex-centred in a viewport-sized stage, so its `x`/`y` are offsets
 * of its centre from the stage centre. Converting through this is what lets a
 * thumbnail rect become an animation target for a box that lives inside the
 * swipe and zoom layers.
 */
export function boxGeometry(rect: Rect, centre: { x: number; y: number }): Rect {
  return {
    x: rect.x + rect.width / 2 - centre.x,
    y: rect.y + rect.height / 2 - centre.y,
    width: rect.width,
    height: rect.height,
  };
}
