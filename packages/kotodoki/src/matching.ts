import type { HolidayEntry, PhraseEntry, ResolvedKotodokiContext } from "./types.js";

export function matchesLocale(locales: readonly string[], locale: string): boolean {
  const normalizedLocale = locale.toLowerCase();
  const language = normalizedLocale.split("-")[0];

  return locales.some((candidate) => {
    const normalizedCandidate = candidate.toLowerCase();
    return (
      normalizedCandidate === "*" ||
      normalizedCandidate === normalizedLocale ||
      normalizedCandidate === language ||
      normalizedCandidate.split("-")[0] === language
    );
  });
}

export function matchesRegion(
  regions: readonly string[] | undefined,
  region: string,
): boolean {
  if (!regions || regions.length === 0) {
    return true;
  }

  const normalizedRegion = region.toUpperCase();
  return regions.some(
    (candidate) =>
      candidate === "*" || candidate.toUpperCase() === normalizedRegion,
  );
}

export function entryMatchesContext(
  entry: PhraseEntry,
  context: ResolvedKotodokiContext,
): boolean {
  if (!matchesLocale(entry.locales, context.locale)) {
    return false;
  }

  if (!matchesRegion(entry.regions, context.region)) {
    return false;
  }

  const conditions = entry.conditions;
  if (!conditions) {
    return true;
  }

  if (conditions.months && !conditions.months.includes(context.month)) {
    return false;
  }

  if (conditions.weekdays && !conditions.weekdays.includes(context.weekday)) {
    return false;
  }

  if (conditions.hours && !hourIsInRange(context.hour, conditions.hours)) {
    return false;
  }

  if (conditions.seasons && !conditions.seasons.includes(context.season)) {
    return false;
  }

  if (
    conditions.holidays &&
    !conditions.holidays.some((holidayId) =>
      context.holidayIds.includes(holidayId),
    )
  ) {
    return false;
  }

  if (
    conditions.dayPeriods &&
    !conditions.dayPeriods.includes(context.dayPeriod)
  ) {
    return false;
  }

  return true;
}

export function isFallbackPhrase(entry: PhraseEntry): boolean {
  const conditions = entry.conditions;
  if (!conditions) {
    return true;
  }

  return (
    !conditions.months &&
    !conditions.weekdays &&
    !conditions.hours &&
    !conditions.seasons &&
    !conditions.holidays &&
    !conditions.dayPeriods
  );
}

export function holidayMatchesLocaleAndRegion(
  holiday: HolidayEntry,
  locale: string,
  region: string,
): boolean {
  return (
    matchesLocale(holiday.locales, locale) &&
    matchesRegion(holiday.regions, region)
  );
}

function hourIsInRange(hour: number, [startHour, endHour]: readonly [number, number]) {
  if (startHour === endHour) {
    return true;
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }

  return hour >= startHour || hour < endHour;
}
