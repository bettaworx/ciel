export const POST_CONTENT_COLLAPSE_HEIGHT = 128;

type PostContentCollapseOptions = {
  collapseContent: boolean;
  isExpanded: boolean;
  isOverflowing: boolean;
};

export function shouldCollapsePostContent({
  collapseContent,
  isExpanded,
  isOverflowing,
}: PostContentCollapseOptions) {
  return collapseContent && !isExpanded && isOverflowing;
}

export function shouldShowPostContentToggle(
  collapseContent: boolean,
  isOverflowing: boolean,
) {
  return collapseContent && isOverflowing;
}
