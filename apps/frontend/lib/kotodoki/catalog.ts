import { createDatasetCatalog } from "@ciel/kotodoki";
import type { KotodokiDatasetCollection } from "@ciel/kotodoki";
import { greetDatasets } from "@/lib/kotodoki/greet";

export const greetDatasetCollection = {
  id: "frontend-greet",
  category: "greet",
  label: "Composer greetings",
  description: "Short locale-aware phrases for frontend composer placeholders.",
  source: {
    type: "app",
    owner: "frontend",
    path: "apps/frontend/lib/kotodoki/greet",
  },
  datasets: greetDatasets,
} satisfies KotodokiDatasetCollection;

export const frontendKotodokiCatalog = createDatasetCatalog([
  greetDatasetCollection,
]);
