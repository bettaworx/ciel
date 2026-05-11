import { describe, expect, it } from "vitest";
import { createDatasetCatalog, resolveKotodokiContext } from "../src/index.js";
import type { KotodokiDataset, KotodokiDatasetCollection } from "../src/index.js";

const holidayDataset = {
  id: "holidays-ja-JP",
  locale: "ja-JP",
  region: "JP",
  holidays: [
    {
      id: "tanabata",
      locales: ["ja", "ja-JP"],
      regions: ["JP"],
      match: { type: "date", month: 7, day: 7 },
    },
    {
      id: "obon",
      locales: ["ja", "ja-JP"],
      regions: ["JP"],
      match: { type: "dateRange", start: { month: 8, day: 13 }, end: { month: 8, day: 16 } },
    },
  ],
  phrases: [],
} satisfies KotodokiDataset;

const holidayCollection = {
  id: "holiday-test",
  category: "test",
  source: {
    type: "app",
    owner: "kotodoki-tests",
  },
  datasets: [holidayDataset],
} satisfies KotodokiDatasetCollection;

const holidayCatalog = createDatasetCatalog([holidayCollection]);

describe("resolveKotodokiContext", () => {
  it("resolves date parts in the requested timezone", () => {
    const context = resolveKotodokiContext({
      datetime: "2026-01-01T00:30:00.000Z",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(context.date).toBe("2026-01-01");
    expect(context.hour).toBe(9);
    expect(context.weekday).toBe(4);
  });

  it("uses month-based seasons for Japan", () => {
    const context = resolveKotodokiContext({
      datetime: "2026-04-15T12:00:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(context.season).toBe("spring");
  });

  it("resolves fixed-date and range holidays for Japan", () => {
    const tanabata = resolveKotodokiContext(
      {
        datetime: "2026-07-07T12:00:00+09:00",
        timezone: "Asia/Tokyo",
        locale: "ja-JP",
        region: "JP",
      },
      { catalog: holidayCatalog, categories: ["test"] },
    );
    const obon = resolveKotodokiContext(
      {
        datetime: "2026-08-15T12:00:00+09:00",
        timezone: "Asia/Tokyo",
        locale: "ja-JP",
        region: "JP",
      },
      { catalog: holidayCatalog, categories: ["test"] },
    );

    expect(tanabata.holidayIds).toContain("tanabata");
    expect(obon.holidayIds).toContain("obon");
  });
});
