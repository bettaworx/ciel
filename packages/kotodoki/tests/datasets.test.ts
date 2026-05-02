import { describe, expect, it } from "vitest";
import { jaJPDataset } from "../src/index.js";

describe("built-in datasets", () => {
  it("keeps ja-JP phrases free of commas and periods", () => {
    for (const entry of jaJPDataset.phrases) {
      const prohibitedPunctuation = entry.phrase.match(/[、。，．,.]/g) ?? [];

      expect(
        prohibitedPunctuation,
        `${entry.id} should not use commas or periods`,
      ).toEqual([]);
    }
  });

  it("keeps each ja-JP phrase to one utterance", () => {
    for (const entry of jaJPDataset.phrases) {
      const allowedEndings = entry.phrase.match(/[！？!?]/g) ?? [];

      expect(
        allowedEndings.length,
        `${entry.id} should not combine multiple questions or exclamations`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
