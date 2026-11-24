/**
 * Grid placement for a post's attachments. Images and videos share one ordered
 * list, so a cell can hold either. A single attachment is laid out by its own
 * aspect ratio and is not covered here.
 */
export interface MediaGridLayout {
  columns: 2 | 3;
  /** Per-cell size and rounding classes, one per attachment, in order. */
  cells: string[];
  /** Approximate width / height of the whole grid, as a CSS ratio. */
  ratio: string;
}

export function mediaGridLayout(count: number): MediaGridLayout {
  if (count === 2) {
    return {
      columns: 2,
      cells: ["aspect-[8/9] rounded-l-xl", "aspect-[8/9] rounded-r-xl"],
      ratio: "16 / 9",
    };
  }
  if (count === 3) {
    return {
      columns: 2,
      cells: [
        "row-span-2 rounded-l-xl",
        "aspect-video rounded-tr-xl",
        "aspect-video rounded-br-xl",
      ],
      ratio: "16 / 9",
    };
  }
  if (count === 4) {
    return {
      columns: 2,
      cells: [
        "aspect-video rounded-tl-xl",
        "aspect-video rounded-tr-xl",
        "aspect-video rounded-bl-xl",
        "aspect-video rounded-br-xl",
      ],
      ratio: "16 / 9",
    };
  }
  // Five or more: every attachment gets a square in a 3-column grid. None is
  // tucked behind a "+N" cell, because the lightbox cannot show videos yet and
  // a hidden video would be unreachable.
  return {
    columns: 3,
    cells: Array.from({ length: count }, () => "aspect-square rounded-lg"),
    ratio: `3 / ${Math.ceil(count / 3)}`,
  };
}

/**
 * Each attachment's position in the lightbox, which shows images only; null
 * exactly for videos. Grid cells and lightbox slides diverge once a video sits
 * between images.
 */
export function lightboxIndices(types: readonly ("image" | "video")[]): (number | null)[] {
  let next = 0;
  return types.map((type) => (type === "video" ? null : next++));
}
