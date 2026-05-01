import { describe, expect, it } from "vitest";
import {
  DEFAULT_MFM_SETTINGS,
  type MfmSettings,
} from "@/atoms/mfm-settings";
import {
  buildAllowListFromSettings,
  filterMfmNodes,
  parseMfm,
} from "@/lib/mfm/parse";

describe("mfm parse filtering", () => {
  it("preserves custom emoji inside disabled x3/x4 decorations", () => {
    const settings: MfmSettings = {
      ...DEFAULT_MFM_SETTINGS,
      expand: { allowLargerThanX2: false },
    };

    const filtered = filterMfmNodes(
      parseMfm("$[x3 :blobcat:]"),
      buildAllowListFromSettings(settings),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.type).toBe("emojiCode");
    expect(filtered[0]?.props).toMatchObject({ name: "blobcat" });
  });
});
