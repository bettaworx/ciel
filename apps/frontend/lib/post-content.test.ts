import { describe, expect, it } from "vitest";

import {
  shouldCollapsePostContent,
  shouldShowPostContentToggle,
} from "@/lib/post-content";

describe("post content collapse helpers", () => {
  it("collapses overflowing content only when collapsing is enabled and content is not expanded", () => {
    expect(
      shouldCollapsePostContent({
        collapseContent: true,
        isExpanded: false,
        isOverflowing: true,
      }),
    ).toBe(true);

    expect(
      shouldCollapsePostContent({
        collapseContent: true,
        isExpanded: true,
        isOverflowing: true,
      }),
    ).toBe(false);
  });

  it("keeps detail-page content fully visible when collapsing is disabled", () => {
    expect(
      shouldCollapsePostContent({
        collapseContent: false,
        isExpanded: false,
        isOverflowing: true,
      }),
    ).toBe(false);
    expect(shouldShowPostContentToggle(false, true)).toBe(false);
  });
});
