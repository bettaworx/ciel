import { describe, expect, it } from "vitest";
import { createDatasetCatalog, createKotodoki } from "../src/index.js";
import type { KotodokiDataset, KotodokiDatasetCollection } from "../src/index.js";

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

const otherCategoryDataset = {
  id: "other-ja-JP",
  locale: "ja-JP",
  region: "JP",
  holidays: [],
  phrases: [
    {
      id: "other-fallback",
      locales: ["ja-JP"],
      regions: ["JP"],
      phrase: "other fallback",
    },
  ],
} satisfies KotodokiDataset;

function createTestCatalog(
  datasets: readonly KotodokiDataset[],
  category = "test",
) {
  const collection = {
    id: `${category}-collection`,
    category,
    source: {
      type: "app",
      owner: "kotodoki-tests",
    },
    datasets,
  } satisfies KotodokiDatasetCollection;

  return createDatasetCatalog([collection]);
}

describe("createKotodoki", () => {
  it("weights matched phrases without excluding fallback phrases", () => {
    const kotodoki = createKotodoki({
      catalog: createTestCatalog([testDataset]),
      categories: ["test"],
    });
    const input = {
      datetime: "2026-01-05T12:30:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    };

    const timeResult = kotodoki.selectPhrase(input, { rng: () => 0 });
    const seasonResult = kotodoki.selectPhrase(input, { rng: () => 0.6 });
    const fallbackResult = kotodoki.selectPhrase(input, { rng: () => 0.9 });

    expect(fallbackResult.matched.map((entry) => entry.id)).toEqual([
      "noon",
      "winter",
    ]);
    expect(timeResult.reason).toBe("matched");
    expect(timeResult.selected?.id).toBe("noon");
    expect(seasonResult.reason).toBe("matched");
    expect(seasonResult.selected?.id).toBe("winter");
    expect(fallbackResult.reason).toBe("fallback");
    expect(fallbackResult.selected?.id).toBe("fallback-a");
  });

  it("uses injected random sources for reproducible fallback selection", () => {
    const kotodoki = createKotodoki({
      catalog: createTestCatalog([fallbackOnlyDataset]),
      categories: ["test"],
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
      catalog: createTestCatalog([testDataset]),
      categories: ["test"],
      rng: () => 0.4,
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

  it("keeps lower-weight matches and fallbacks eligible on holidays", () => {
    const kotodoki = createKotodoki({
      catalog: createTestCatalog([testDataset]),
      categories: ["test"],
    });
    const input = {
      datetime: "2026-01-02T12:30:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    };

    expect(kotodoki.selectPhrase(input, { rng: () => 0 }).selected?.id).toBe(
      "noon",
    );
    expect(kotodoki.selectPhrase(input, { rng: () => 0.4 }).selected?.id).toBe(
      "holiday",
    );
    expect(kotodoki.selectPhrase(input, { rng: () => 0.8 }).selected?.id).toBe(
      "winter",
    );

    const fallbackResult = kotodoki.selectPhrase(input, { rng: () => 0.95 });

    expect(fallbackResult.reason).toBe("fallback");
    expect(fallbackResult.selected?.id).toBe("fallback-a");
  });

  it("matches hour ranges that cross midnight", () => {
    const kotodoki = createKotodoki({
      catalog: createTestCatalog([crossMidnightDataset]),
      categories: ["test"],
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

  it("uses only selected catalog categories", () => {
    const catalog = createDatasetCatalog([
      {
        id: "test-collection",
        category: "test",
        source: { type: "app", owner: "kotodoki-tests" },
        datasets: [testDataset],
      },
      {
        id: "other-collection",
        category: "other",
        source: { type: "app", owner: "kotodoki-tests" },
        datasets: [otherCategoryDataset],
      },
    ]);
    const kotodoki = createKotodoki({
      catalog,
      categories: ["test"],
      rng: () => 0,
    });

    const result = kotodoki.selectPhrase({
      datetime: "2026-01-05T12:30:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(result.matched.map((entry) => entry.id)).toEqual([
      "noon",
      "winter",
    ]);
    expect(result.fallbacks.map((entry) => entry.id)).toEqual([
      "fallback-a",
      "fallback-b",
    ]);
  });

  it("returns no selection for missing categories", () => {
    const kotodoki = createKotodoki({
      catalog: createTestCatalog([testDataset]),
      categories: ["missing"],
    });

    const result = kotodoki.selectPhrase({
      datetime: "2026-01-05T12:30:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(result.matched).toEqual([]);
    expect(result.fallbacks).toEqual([]);
    expect(result.selected).toBeNull();
    expect(result.reason).toBe("none");
  });
});
