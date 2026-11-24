/**
 * Layout for a post's attachments. Images and videos share one ordered list,
 * so a cell or slide can hold either:
 * - 1 attachment: laid out by its own aspect ratio (PostMediaPreview)
 * - 2-4: a fixed grid, GRID_CELLS
 * - 5 or more: a horizontal carousel, sized by carouselItemRatio, resting on
 *   carouselSnapPoints and stepped by carouselStepTarget
 */

/** More attachments than this go into a carousel instead of a grid. */
export const MAX_GRID_ITEMS = 4;

/** Per-cell size and rounding classes for the 2-4 grids; all are ~16:9 overall. */
export const GRID_CELLS: Record<2 | 3 | 4, readonly string[]> = {
  2: ["aspect-[8/9] rounded-l-xl", "aspect-[8/9] rounded-r-xl"],
  3: ["row-span-2 rounded-l-xl", "aspect-video rounded-tr-xl", "aspect-video rounded-br-xl"],
  4: [
    "aspect-video rounded-tl-xl",
    "aspect-video rounded-tr-xl",
    "aspect-video rounded-bl-xl",
    "aspect-video rounded-br-xl",
  ],
};

/** No carousel slide is wider than 4:3, so a panorama cannot crowd out its neighbours. */
export const CAROUSEL_MAX_RATIO = 4 / 3;
/** Nor is a video slide narrower than 3:4: the player needs room for its controls. */
export const CAROUSEL_MIN_VIDEO_RATIO = 3 / 4;

/**
 * Width / height of a carousel slide; square when the dimensions are unknown.
 *
 * Landscape media is capped at 4:3. A portrait image keeps its own shape however
 * tall it is; the slide's CSS min-width (two corner radii) stops it from
 * collapsing below its own rounded corners.
 */
export function carouselItemRatio(
  width: number | null | undefined,
  height: number | null | undefined,
  type: "image" | "video",
) {
  if (!width || !height || width <= 0 || height <= 0) return 1;
  const ratio = Math.min(CAROUSEL_MAX_RATIO, width / height);
  return type === "video" ? Math.max(CAROUSEL_MIN_VIDEO_RATIO, ratio) : ratio;
}

/** Sub-pixel slack: scroll positions are fractional on high-DPI screens. */
const EDGE_SLACK = 1;

/**
 * The scroll position that rests on each slide: the one that centres it,
 * clamped to the track's own scroll range.
 *
 * This is exactly where `scroll-snap-align: center` stops, since the browser
 * clamps a snap position it cannot reach. So a middle slide rests centred,
 * while the first rests flush left and the last flush right. The track is never
 * padded to let an edge slide reach the middle.
 *
 * `slides` are in the track's scroll coordinates; `viewport` is the track's
 * visible width and `max` the furthest it can scroll. The result never
 * decreases, since slides sit left to right.
 *
 * The end slides land on 0 and `max` only while no slide is wider than the
 * track; a wider one would centre a few pixels short of the edge, leaving the
 * edge itself unreachable. The slides' CSS max-width keeps that true.
 */
export function carouselSnapPoints(
  slides: readonly { start: number; width: number }[],
  viewport: number,
  max: number,
): number[] {
  return slides.map(({ start, width }) =>
    Math.min(max, Math.max(0, start + width / 2 - viewport / 2)),
  );
}

/**
 * Where an arrow button scrolls: the next snap point in `direction` that
 * actually moves the track, so each press advances exactly one slide.
 *
 * `from` is where the track is headed rather than where it is: pass the
 * target of a smooth scroll still in flight, or a second quick press would
 * land on the same slide as the first. Slides that share a clamped point at an
 * end cannot rest apart, so they are passed over together.
 */
export function carouselStepTarget(
  points: readonly number[],
  from: number,
  direction: 1 | -1,
): number {
  if (points.length === 0) return 0;
  if (direction === 1) {
    return points.find((point) => point > from + EDGE_SLACK) ?? points[points.length - 1];
  }
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i] < from - EDGE_SLACK) return points[i];
  }
  return points[0];
}

/** Whether the track sits at either end, which hides that end's arrow. */
export function carouselEdges(scrollLeft: number, max: number) {
  return { atStart: scrollLeft <= EDGE_SLACK, atEnd: scrollLeft >= max - EDGE_SLACK };
}
