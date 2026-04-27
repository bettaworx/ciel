import type { EmojiCategory } from "./types";

export interface EmojiPickerLayoutMetrics {
  cellSize: number;
  rowGap: number;
  columnGap: number;
  gridPaddingX: number;
  headerHeight: number;
  sectionSpacing: number;
}

export interface EmojiPickerSectionLayout {
  id: string;
  rowCount: number;
  gridHeight: number;
  sectionHeight: number;
  offsetTop: number;
}

export function getGridWidth(
  columns: number,
  metrics: EmojiPickerLayoutMetrics,
): number {
  return columns * metrics.cellSize;
}

export function getGridHeight(
  itemCount: number,
  columns: number,
  metrics: EmojiPickerLayoutMetrics,
): number {
  const rowCount = columns > 0 ? Math.ceil(itemCount / columns) : 0;
  if (rowCount === 0) {
    return 0;
  }

  return rowCount * metrics.cellSize;
}

export function buildSectionLayouts(
  categories: EmojiCategory[],
  columns: number,
  metrics: EmojiPickerLayoutMetrics,
): EmojiPickerSectionLayout[] {
  let offsetTop = 0;

  return categories.map((category, index) => {
    const rowCount = columns > 0 ? Math.ceil(category.emojis.length / columns) : 0;
    const gridHeight = getGridHeight(category.emojis.length, columns, metrics);
    const sectionHeight =
      metrics.headerHeight + gridHeight + (index === categories.length - 1 ? 0 : metrics.sectionSpacing);

    const layout: EmojiPickerSectionLayout = {
      id: category.id,
      rowCount,
      gridHeight,
      sectionHeight,
      offsetTop,
    };

    offsetTop += sectionHeight;
    return layout;
  });
}

export function findActiveCategoryId(
  layouts: EmojiPickerSectionLayout[],
  scrollTop: number,
  clientHeight: number,
  stickyHeaderOffset: number,
): string {
  if (layouts.length === 0) {
    return "";
  }

  const viewportAnchor =
    scrollTop + stickyHeaderOffset + Math.max(24, Math.floor(clientHeight * 0.2));

  let activeId = layouts[0].id;
  for (const layout of layouts) {
    if (layout.offsetTop <= viewportAnchor) {
      activeId = layout.id;
      continue;
    }
    break;
  }

  return activeId;
}
