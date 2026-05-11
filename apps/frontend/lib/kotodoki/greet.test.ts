import { createKotodoki } from "@ciel/kotodoki";
import { describe, expect, it } from "vitest";
import { frontendKotodokiCatalog } from "@/lib/kotodoki/catalog";
import {
  enUSGreetDataset,
  greetDatasets,
  jaJPGreetDataset,
} from "@/lib/kotodoki/greet";

describe("frontend greet datasets", () => {
  it("keeps greet datasets split by locale files", () => {
    expect(greetDatasets).toEqual([jaJPGreetDataset, enUSGreetDataset]);
    expect(jaJPGreetDataset.locale).toBe("ja-JP");
    expect(enUSGreetDataset.locale).toBe("en-US");
  });

  it("keeps greet phrases free of commas and periods", () => {
    for (const dataset of greetDatasets) {
      for (const entry of dataset.phrases) {
        const prohibitedPunctuation = entry.phrase.match(/[、。，．,.]/g) ?? [];

        expect(
          prohibitedPunctuation,
          `${entry.id} should not use commas or periods`,
        ).toEqual([]);
      }
    }
  });

  it("keeps each greet phrase to one utterance", () => {
    for (const dataset of greetDatasets) {
      for (const entry of dataset.phrases) {
        const allowedEndings = entry.phrase.match(/[！？!?]/g) ?? [];

        expect(
          allowedEndings.length,
          `${entry.id} should not combine multiple questions or exclamations`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps en-US greet focused on time-of-day phrases", () => {
    expect(enUSGreetDataset.holidays).toEqual([]);

    for (const entry of enUSGreetDataset.phrases) {
      const conditionKeys = Object.keys(entry.conditions ?? {}).sort();

      expect(
        conditionKeys.every((key) => key === "dayPeriods" || key === "hours"),
        `${entry.id} should only use time-of-day conditions`,
      ).toBe(true);
    }
  });

  it("selects frontend greet phrases through kotodoki catalog", () => {
    const kotodoki = createKotodoki({
      catalog: frontendKotodokiCatalog,
      categories: ["greet"],
      rng: () => 0,
    });

    const jaResult = kotodoki.selectPhrase({
      datetime: "2026-07-07T12:00:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });
    const enResult = kotodoki.selectPhrase({
      datetime: "2026-01-05T08:30:00-05:00",
      timezone: "America/New_York",
      locale: "en-US",
      region: "US",
    });

    expect(jaResult.context.holidayIds).toContain("tanabata");
    expect(jaResult.matched.map((entry) => entry.id)).toContain("ja-tanabata");
    expect(enResult.matched.map((entry) => entry.id)).toEqual(["en-morning"]);
  });
});
