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

export interface StageTransform {
  /** Swipe layer translation. */
  dragX: number;
  dragY: number;
  /** Swipe layer scale, shrunk by the dismiss gesture. */
  stageScale: number;
  /** Zoom layer translation. */
  panX: number;
  panY: number;
  /** Zoom layer scale. */
  zoom: number;
}

/**
 * The rect a stage-space `base` occupies on screen under the two nested
 * transforms the Lightbox applies.
 *
 * Both layers fill the viewport, so both transform about the same origin `c`.
 * CSS applies `translate(t) scale(s)` right-to-left — scale first — so:
 *
 *   inner: p -> c + (p - c) * zoom + pan
 *   outer: q -> c + (q - c) * stageScale + drag
 *   both:  p -> c + ((p - c) * zoom + pan) * stageScale + drag
 */
export function transformRect(
  base: Rect,
  t: StageTransform,
  centre: { x: number; y: number },
): Rect {
  const project = (p: number, c: number, pan: number, drag: number) =>
    c + ((p - c) * t.zoom + pan) * t.stageScale + drag;
  const scale = t.zoom * t.stageScale;
  return {
    x: project(base.x, centre.x, t.panX, t.dragX),
    y: project(base.y, centre.y, t.panY, t.dragY),
    width: base.width * scale,
    height: base.height * scale,
  };
}
