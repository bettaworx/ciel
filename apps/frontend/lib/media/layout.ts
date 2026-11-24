/**
 * Layout for a post's attachments. Images and videos share one ordered list,
 * so a cell or slide can hold either:
 * - 1 attachment: laid out by its own aspect ratio (PostMediaPreview)
 * - 2-4: a fixed grid, GRID_CELLS
 * - 5 or more: a horizontal carousel (MediaCarousel), sized by carouselItemRatio
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
/** Nor is a video slide narrower than 3:4, so its still has room for the play mark. */
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
