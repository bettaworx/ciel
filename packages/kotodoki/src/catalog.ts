import type {
  KotodokiDataset,
  KotodokiDatasetCatalog,
  KotodokiDatasetCategoryId,
  KotodokiDatasetCollection,
} from "./types.js";

export function createDatasetCatalog(
  collections: readonly KotodokiDatasetCollection[],
): KotodokiDatasetCatalog {
  return {
    collections: [...collections],
  };
}

export function getDatasetCollections(
  catalog: KotodokiDatasetCatalog,
  categories?: readonly KotodokiDatasetCategoryId[],
): readonly KotodokiDatasetCollection[] {
  if (categories === undefined) {
    return catalog.collections;
  }

  const categorySet = new Set(categories);
  return catalog.collections.filter((collection) =>
    categorySet.has(collection.category),
  );
}

export function getDatasetsByCategory(
  catalog: KotodokiDatasetCatalog,
  category: KotodokiDatasetCategoryId,
): readonly KotodokiDataset[] {
  return getDatasetCollections(catalog, [category]).flatMap(
    (collection) => collection.datasets,
  );
}

export function getAllDatasets(
  catalog: KotodokiDatasetCatalog,
  categories?: readonly KotodokiDatasetCategoryId[],
): readonly KotodokiDataset[] {
  return getDatasetCollections(catalog, categories).flatMap(
    (collection) => collection.datasets,
  );
}
