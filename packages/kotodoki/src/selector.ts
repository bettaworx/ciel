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
      const candidates = matched.length > 0 ? getHighestPriorityMatches(matched) : fallbacks;
      const selected = choose(candidates, selectOptions?.rng ?? rng);

      return {
        context,
        matched,
        fallbacks,
        selected,
        reason: matched.length > 0 ? "matched" : selected ? "fallback" : "none",
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

function getHighestPriorityMatches(entries: readonly PhraseEntry[]) {
  const highestPriority = Math.max(...entries.map(getConditionPriority));
  return entries.filter((entry) => getConditionPriority(entry) === highestPriority);
}

function getConditionPriority(entry: PhraseEntry) {
  const conditions = entry.conditions;
  if (!conditions) {
    return 0;
  }

  if (conditions.holidays) {
    return 100;
  }

  if (conditions.hours || conditions.dayPeriods) {
    return 50;
  }

  if (conditions.weekdays) {
    return 30;
  }

  if (conditions.seasons || conditions.months) {
    return 20;
  }

  return 0;
}

function choose<T>(entries: readonly T[], rng: RandomSource): T | null {
  if (entries.length === 0) {
    return null;
  }

  const value = rng();
  const normalized = Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 0.999_999_999)
    : 0;
  const index = Math.floor(normalized * entries.length);

  return entries[index] ?? entries[0] ?? null;
}
