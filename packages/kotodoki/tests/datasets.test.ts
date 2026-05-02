import { describe, expect, it } from "vitest";
import {
  createDatasetCatalog,
  getAllDatasets,
  getDatasetCollections,
  getDatasetsByCategory,
} from "../src/index.js";
import type { KotodokiDataset, KotodokiDatasetCollection } from "../src/index.js";

const greetDataset = {
  id: "greet-ja-JP",
  locale: "ja-JP",
  region: "JP",
  holidays: [],
  phrases: [
    {
      id: "greet-fallback",
      locales: ["ja-JP"],
      regions: ["JP"],
      phrase: "hello",
    },
  ],
} satisfies KotodokiDataset;

const notifyDataset = {
  id: "notify-ja-JP",
  locale: "ja-JP",
  region: "JP",
  holidays: [],
  phrases: [
    {
      id: "notify-fallback",
      locales: ["ja-JP"],
      regions: ["JP"],
      phrase: "notice",
    },
  ],
} satisfies KotodokiDataset;

const externalCollection = {
  id: "external-greet",
  category: "greet",
  source: {
    type: "repository",
    owner: "example",
    repository: "kotodoki-datasets",
    ref: "main",
    path: "greet/ja-JP.ts",
  },
  datasets: [greetDataset],
} satisfies KotodokiDatasetCollection;

const appCollection = {
  id: "app-notify",
  category: "notify",
  source: {
    type: "app",
    owner: "frontend",
    path: "apps/frontend/lib/kotodoki/notify-datasets.ts",
  },
  datasets: [notifyDataset],
} satisfies KotodokiDatasetCollection;

describe("dataset catalog", () => {
  it("returns collections by category", () => {
    const catalog = createDatasetCatalog([externalCollection, appCollection]);

    expect(getDatasetCollections(catalog, ["greet"])).toEqual([
      externalCollection,
    ]);
    expect(getDatasetCollections(catalog, ["notify"])).toEqual([
      appCollection,
    ]);
  });

  it("expands datasets for selected categories", () => {
    const catalog = createDatasetCatalog([externalCollection, appCollection]);

    expect(getDatasetsByCategory(catalog, "greet")).toEqual([greetDataset]);
    expect(getAllDatasets(catalog, ["notify"])).toEqual([notifyDataset]);
    expect(getAllDatasets(catalog)).toEqual([greetDataset, notifyDataset]);
  });

  it("keeps source metadata with collections", () => {
    const catalog = createDatasetCatalog([externalCollection]);

    expect(catalog.collections[0]?.source).toEqual({
      type: "repository",
      owner: "example",
      repository: "kotodoki-datasets",
      ref: "main",
      path: "greet/ja-JP.ts",
    });
  });
});
