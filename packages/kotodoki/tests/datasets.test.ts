import { describe, expect, it } from "vitest";
import { enUSDataset, jaJPDataset } from "../src/index.js";

const builtInDatasets = [jaJPDataset, enUSDataset] as const;

describe("built-in datasets", () => {
  it("keeps built-in phrases free of commas and periods", () => {
    for (const dataset of builtInDatasets) {
      for (const entry of dataset.phrases) {
        const prohibitedPunctuation = entry.phrase.match(/[、。，．,.]/g) ?? [];

        expect(
          prohibitedPunctuation,
          `${entry.id} should not use commas or periods`,
        ).toEqual([]);
      }
    }
  });

  it("keeps each built-in phrase to one utterance", () => {
    for (const dataset of builtInDatasets) {
      for (const entry of dataset.phrases) {
        const allowedEndings = entry.phrase.match(/[！？!?]/g) ?? [];

        expect(
          allowedEndings.length,
          `${entry.id} should not combine multiple questions or exclamations`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps en-US focused on time-of-day phrases", () => {
    expect(enUSDataset.holidays).toEqual([]);

    for (const entry of enUSDataset.phrases) {
      const conditionKeys = Object.keys(entry.conditions ?? {}).sort();

      expect(
        conditionKeys.every((key) => key === "dayPeriods" || key === "hours"),
        `${entry.id} should only use time-of-day conditions`,
      ).toBe(true);
    }
  });
});
