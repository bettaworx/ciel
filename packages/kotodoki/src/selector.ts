import { defaultDatasets } from "./datasets/index.js";
import { resolveKotodokiContext } from "./context.js";
import { entryMatchesContext, isFallbackPhrase } from "./matching.js";
import type {
  Kotodoki,
  KotodokiInput,
  KotodokiOptions,
  KotodokiSelection,
  PhraseEntry,
  RandomSource,
  SelectPhraseOptions,
} from "./types.js";

const DEFAULT_LOCALE = "ja-JP";
const DEFAULT_REGION = "JP";
const DEFAULT_TIMEZONE = "Asia/Tokyo";
const FALLBACK_WEIGHT = 0.5;
const CONDITIONAL_BASE_WEIGHT = 2;

export function createKotodoki(options: KotodokiOptions = {}): Kotodoki {
  const datasets = options.datasets ?? defaultDatasets;
  const defaultLocale = options.defaultLocale ?? DEFAULT_LOCALE;
  const defaultRegion = options.defaultRegion ?? DEFAULT_REGION;
  const defaultTimezone = options.defaultTimezone ?? DEFAULT_TIMEZONE;
  const rng = options.rng ?? Math.random;

  return {
    resolveContext(input?: KotodokiInput) {
      return resolveKotodokiContext(input, {
        datasets,
        defaultLocale,
        defaultRegion,
        defaultTimezone,
      });
    },

    getMatchingPhrases(input?: KotodokiInput) {
      const context = this.resolveContext(input);
      return getConditionalMatches(datasets.flatMap((dataset) => dataset.phrases), context);
    },

    selectPhrase(input?: KotodokiInput, selectOptions?: SelectPhraseOptions) {
      const context = this.resolveContext(input);
      const phrases = datasets.flatMap((dataset) => dataset.phrases);
      const matched = getConditionalMatches(phrases, context);
      const fallbacks = phrases.filter(
        (entry) => isFallbackPhrase(entry) && entryMatchesContext(entry, context),
      );
      const candidates = [...matched, ...fallbacks];
      const selected = chooseWeighted(candidates, selectOptions?.rng ?? rng);

      return {
        context,
        matched,
        fallbacks,
        selected,
        reason: selected
          ? isFallbackPhrase(selected)
            ? "fallback"
            : "matched"
          : "none",
      } satisfies KotodokiSelection;
    },
  };
}

export function selectPhrase(
  input?: KotodokiInput,
  options?: SelectPhraseOptions,
): KotodokiSelection {
  return createKotodoki().selectPhrase(input, options);
}

function getConditionalMatches(
  phrases: readonly PhraseEntry[],
  context: ReturnType<typeof resolveKotodokiContext>,
) {
  return phrases.filter(
    (entry) => !isFallbackPhrase(entry) && entryMatchesContext(entry, context),
  );
}

function getSelectionWeight(entry: PhraseEntry) {
  const conditions = entry.conditions;
  if (isFallbackPhrase(entry)) {
    return FALLBACK_WEIGHT;
  }

  let weight = CONDITIONAL_BASE_WEIGHT;

  if (conditions?.months) {
    weight += 1;
  }

  if (conditions?.seasons) {
    weight += 1;
  }

  if (conditions?.weekdays) {
    weight += 1;
  }

  if (conditions?.hours) {
    weight += 2;
  }

  if (conditions?.dayPeriods) {
    weight += 2;
  }

  if (conditions?.holidays) {
    weight += 4;
  }

  return weight;
}

function chooseWeighted<T extends PhraseEntry>(
  entries: readonly T[],
  rng: RandomSource,
): T | null {
  if (entries.length === 0) {
    return null;
  }

  const totalWeight = entries.reduce(
    (total, entry) => total + getSelectionWeight(entry),
    0,
  );
  const target = normalizeRandomValue(rng()) * totalWeight;
  let cursor = 0;

  for (const entry of entries) {
    cursor += getSelectionWeight(entry);

    if (target < cursor) {
      return entry;
    }
  }

  return entries.at(-1) ?? null;
}

function normalizeRandomValue(value: number) {
  return Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 0.999_999_999)
    : 0;
}
