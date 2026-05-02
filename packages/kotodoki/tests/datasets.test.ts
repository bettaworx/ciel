import { describe, expect, it } from "vitest";
import { jaJPDataset } from "../src/index.js";

describe("built-in datasets", () => {
  it("keeps each phrase to one utterance", () => {
    for (const entry of jaJPDataset.phrases) {
      const sentenceEndings = entry.phrase.match(/[。！？!?]/g) ?? [];

      expect(
        sentenceEndings.length,
        `${entry.id} should not combine multiple utterances`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
