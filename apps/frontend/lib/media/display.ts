/**
 * An image at or below this width is treated as pixel art for display.
 *
 * Nothing in the stored media says whether it was uploaded dot-by-dot, so this
 * stands in for it. The line is drawn where interpolation starts to matter: our
 * layouts paint a single image up to roughly 600px wide, so anything smaller is
 * being upscaled. Below 512 that upscale is enough to visibly smear pixel art,
 * while a photo that small is upscaled by so little that pixelated and smooth
 * are hard to tell apart.
 *
 * ponytail: heuristic. Persist the upload mode on the media row if it ever
 * guesses wrong on real posts.
 */
const PIXEL_ART_MAX_WIDTH = 512;

/**
 * `image-rendering` for a media item, keeping pixel art crisp when a layout
 * blows it up. Returns undefined so it can be spread into a style object
 * without overriding anything.
 */
export function pixelArtRendering(
  width: number | null | undefined,
): "pixelated" | undefined {
  return width && width <= PIXEL_ART_MAX_WIDTH ? "pixelated" : undefined;
}
