import type { HolidayEntry, KotodokiDataset, PhraseEntry } from "../types.js";

const enUSHolidays: readonly HolidayEntry[] = [] as const;

const enUSPhrases: readonly PhraseEntry[] = [
  {
    id: "en-fallback-whats-happening",
    locales: ["en", "en-US"],
    regions: ["US"],
    phrase: "What's happening?",
    tags: ["fallback"],
  },
  {
    id: "en-fallback-up-to",
    locales: ["en", "en-US"],
    regions: ["US"],
    phrase: "What are you up to?",
    tags: ["fallback"],
  },
  {
    id: "en-fallback-mind",
    locales: ["en", "en-US"],
    regions: ["US"],
    phrase: "What is on your mind?",
    tags: ["fallback"],
  },
  {
    id: "en-fallback-small",
    locales: ["en", "en-US"],
    regions: ["US"],
    phrase: "Write something small",
    tags: ["fallback"],
  },
  {
    id: "en-morning",
    locales: ["en", "en-US"],
    regions: ["US"],
    conditions: { dayPeriods: ["morning"] },
    phrase: "Good morning!",
    tags: ["daily"],
  },
  {
    id: "en-noon",
    locales: ["en", "en-US"],
    regions: ["US"],
    conditions: { dayPeriods: ["noon"] },
    phrase: "Time for a break?",
    tags: ["daily"],
  },
  {
    id: "en-afternoon",
    locales: ["en", "en-US"],
    regions: ["US"],
    conditions: { dayPeriods: ["afternoon"] },
    phrase: "How is your day going?",
    tags: ["daily"],
  },
  {
    id: "en-evening",
    locales: ["en", "en-US"],
    regions: ["US"],
    conditions: { dayPeriods: ["evening"] },
    phrase: "Almost there",
    tags: ["daily"],
  },
  {
    id: "en-night",
    locales: ["en", "en-US"],
    regions: ["US"],
    conditions: { dayPeriods: ["night"] },
    phrase: "How was your day?",
    tags: ["daily"],
  },
  {
    id: "en-late-night",
    locales: ["en", "en-US"],
    regions: ["US"],
    conditions: { hours: [23, 2] },
    phrase: "Still awake?",
    tags: ["daily"],
  },
] as const;

export const enUSDataset: KotodokiDataset = {
  id: "en-US",
  locale: "en-US",
  region: "US",
  holidays: enUSHolidays,
  phrases: enUSPhrases,
};
