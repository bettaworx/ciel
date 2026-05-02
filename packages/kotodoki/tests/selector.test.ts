import { describe, expect, it } from "vitest";
import { createKotodoki } from "../src/index.js";
import type { KotodokiDataset } from "../src/index.js";

const testDataset = {
  id: "test-ja-JP",
  locale: "ja-JP",
  region: "JP",
  holidays: [
    {
      id: "test_day",
      locales: ["ja-JP"],
      regions: ["JP"],
      match: { type: "date", month: 1, day: 2 },
    },
  ],
  phrases: [
    {
      id: "fallback-a",
      locales: ["ja-JP"],
      regions: ["JP"],
      phrase: "fallback A",
    },
    {
      id: "fallback-b",
      locales: ["ja-JP"],
      regions: ["JP"],
      phrase: "fallback B",
    },
    {
      id: "noon",
      locales: ["ja-JP"],
      regions: ["JP"],
      conditions: { dayPeriods: ["noon"] },
      phrase: "noon phrase",
    },
    {
      id: "holiday",
      locales: ["ja-JP"],
      regions: ["JP"],
      conditions: { holidays: ["test_day"] },
      phrase: "holiday phrase",
    },
    {
      id: "winter",
      locales: ["ja-JP"],
      regions: ["JP"],
      conditions: { seasons: ["winter"] },
      phrase: "winter phrase",
    },
  ],
} satisfies KotodokiDataset;

const fallbackOnlyDataset = {
  id: "fallback-only-ja-JP",
  locale: "ja-JP",
  region: "JP",
  holidays: [],
  phrases: testDataset.phrases.slice(0, 2),
} satisfies KotodokiDataset;

const crossMidnightDataset = {
  id: "cross-midnight-ja-JP",
  locale: "ja-JP",
  region: "JP",
  holidays: [],
  phrases: [
    {
      id: "fallback",
      locales: ["ja-JP"],
      regions: ["JP"],
      phrase: "fallback",
    },
    {
      id: "night-owl",
      locales: ["ja-JP"],
      regions: ["JP"],
      conditions: { hours: [23, 2] },
      phrase: "night owl phrase",
    },
  ],
} satisfies KotodokiDataset;

describe("createKotodoki", () => {
  it("prioritizes matched phrases over fallback phrases", () => {
    const kotodoki = createKotodoki({
      datasets: [testDataset],
      rng: () => 0.99,
    });

    const result = kotodoki.selectPhrase({
      datetime: "2026-01-05T12:30:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(result.reason).toBe("matched");
    expect(result.matched.map((entry) => entry.id)).toEqual(["noon", "winter"]);
    expect(result.selected?.id).toBe("noon");
  });

  it("uses injected random sources for reproducible fallback selection", () => {
    const kotodoki = createKotodoki({
      datasets: [fallbackOnlyDataset],
      rng: () => 0.75,
    });

    const result = kotodoki.selectPhrase({
      datetime: "2026-01-05T02:30:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(result.reason).toBe("fallback");
    expect(result.selected?.id).toBe("fallback-b");
  });

  it("matches phrases through resolved holiday ids", () => {
    const kotodoki = createKotodoki({
      datasets: [testDataset],
      rng: () => 0.99,
    });

    const result = kotodoki.selectPhrase({
      datetime: "2026-01-02T12:30:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(result.context.holidayIds).toEqual(["test_day"]);
    expect(result.matched.map((entry) => entry.id)).toEqual([
      "noon",
      "holiday",
      "winter",
    ]);
    expect(result.selected?.id).toBe("holiday");
  });

  it("matches hour ranges that cross midnight", () => {
    const kotodoki = createKotodoki({
      datasets: [crossMidnightDataset],
    });

    const getMatchedIds = (datetime: string) =>
      kotodoki
        .getMatchingPhrases({
          datetime,
          timezone: "Asia/Tokyo",
          locale: "ja-JP",
          region: "JP",
        })
        .map((entry) => entry.id);

    expect(getMatchedIds("2026-01-05T22:30:00+09:00")).toEqual([]);
    expect(getMatchedIds("2026-01-05T23:30:00+09:00")).toEqual(["night-owl"]);
    expect(getMatchedIds("2026-01-06T01:30:00+09:00")).toEqual(["night-owl"]);
    expect(getMatchedIds("2026-01-06T02:00:00+09:00")).toEqual([]);
  });

  it("selects en-US phrases from the default datasets", () => {
    const kotodoki = createKotodoki({
      rng: () => 0,
    });

    const result = kotodoki.selectPhrase({
      datetime: "2026-01-05T08:30:00-05:00",
      timezone: "America/New_York",
      locale: "en-US",
      region: "US",
    });

    expect(result.context.holidayIds).toEqual([]);
    expect(result.matched.map((entry) => entry.id)).toEqual(["en-morning"]);
    expect(result.selected?.id).toBe("en-morning");
  });

  it("matches en-US time-of-day phrases", () => {
    const kotodoki = createKotodoki();
    const getMatchedIds = (datetime: string) =>
      kotodoki
        .getMatchingPhrases({
          datetime,
          timezone: "America/New_York",
          locale: "en-US",
          region: "US",
        })
        .map((entry) => entry.id);

    expect(getMatchedIds("2026-01-05T08:30:00-05:00")).toEqual(["en-morning"]);
    expect(getMatchedIds("2026-01-05T12:30:00-05:00")).toEqual(["en-noon"]);
    expect(getMatchedIds("2026-01-05T23:30:00-05:00")).toEqual([
      "en-night",
      "en-late-night",
    ]);
  });
});
