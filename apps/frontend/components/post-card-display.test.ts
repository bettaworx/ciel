import { describe, expect, it } from "vitest";

import {
  getPostCardDisplayConfig,
  POST_CARD_DISPLAY_CONFIGS,
} from "@/components/post-card-display";

describe("post card display configs", () => {
  it("keeps timeline cards in the compact linked layout", () => {
    expect(getPostCardDisplayConfig("timeline")).toEqual({
      linkToDetail: true,
      identityLayout: "inline",
      collapseContent: true,
      timestampFormat: "relative",
      timestampPlacement: "header",
    });
  });

  it("keeps detail cards expanded with a standalone full timestamp", () => {
    expect(getPostCardDisplayConfig("detail")).toEqual({
      linkToDetail: false,
      identityLayout: "vertical",
      collapseContent: false,
      timestampFormat: "full",
      timestampPlacement: "afterContent",
    });
  });

  it("defines every supported variant in one place", () => {
    expect(Object.keys(POST_CARD_DISPLAY_CONFIGS).sort()).toEqual([
      "detail",
      "timeline",
    ]);
  });
});
