import { getAllDatasets } from "./catalog.js";
import { holidayMatchesLocaleAndRegion } from "./matching.js";
import type {
  DayPeriod,
  HolidayEntry,
  HolidayMatch,
  KotodokiDataset,
  KotodokiInput,
  ResolveKotodokiContextOptions,
  ResolvedKotodokiContext,
  Season,
  Weekday,
} from "./types.js";

const DEFAULT_LOCALE = "ja-JP";
const DEFAULT_REGION = "JP";
const DEFAULT_TIMEZONE = "Asia/Tokyo";

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: Weekday;
  hour: number;
  minute: number;
};

export function resolveKotodokiContext(
  input: KotodokiInput = {},
  options: ResolveKotodokiContextOptions = {},
): ResolvedKotodokiContext {
  const locale = input.locale ?? options.defaultLocale ?? DEFAULT_LOCALE;
  const region = (input.region ?? options.defaultRegion ?? DEFAULT_REGION).toUpperCase();
  const timezone =
    input.timezone ?? options.defaultTimezone ?? getSystemTimezone();
  const instant = normalizeInstant(input.datetime);
  const parts = getZonedDateParts(instant, timezone);
  const datasets = options.catalog
    ? getAllDatasets(options.catalog, options.categories)
    : [];
  const holidays = resolveHolidays(datasets, parts, locale, region);

  return {
    input: {
      locale,
      region,
      timezone,
      datetime: input.datetime ?? instant,
    },
    locale,
    region,
    timezone,
    instant,
    date: formatDate(parts),
    ...parts,
    season: getSeason(parts.month, region),
    dayPeriod: getDayPeriod(parts.hour),
    holidays,
    holidayIds: holidays.map((holiday) => holiday.id),
  };
}

export function getSeason(month: number, _region = DEFAULT_REGION): Season {
  if (month >= 3 && month <= 5) {
    return "spring";
  }

  if (month >= 6 && month <= 8) {
    return "summer";
  }

  if (month >= 9 && month <= 11) {
    return "autumn";
  }

  return "winter";
}

export function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 0 && hour < 5) {
    return "late_night";
  }

  if (hour >= 5 && hour < 11) {
    return "morning";
  }

  if (hour >= 11 && hour < 14) {
    return "noon";
  }

  if (hour >= 14 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 20) {
    return "evening";
  }

  return "night";
}

function resolveHolidays(
  datasets: readonly KotodokiDataset[],
  parts: ZonedDateParts,
  locale: string,
  region: string,
): readonly HolidayEntry[] {
  return datasets
    .filter((dataset) => dataset.region === region)
    .flatMap((dataset) => dataset.holidays)
    .filter((holiday) => holidayMatchesLocaleAndRegion(holiday, locale, region))
    .filter((holiday) => holidayMatchApplies(holiday.match, parts));
}

function holidayMatchApplies(
  match: HolidayMatch,
  parts: Pick<ZonedDateParts, "month" | "day">,
): boolean {
  if (match.type === "date") {
    return match.month === parts.month && match.day === parts.day;
  }

  const current = toMonthDayNumber(parts);
  const start = toMonthDayNumber(match.start);
  const end = toMonthDayNumber(match.end);

  if (start <= end) {
    return current >= start && current <= end;
  }

  return current >= start || current <= end;
}

function normalizeInstant(value: KotodokiInput["datetime"]): Date {
  const instant = value === undefined ? new Date() : new Date(value);

  if (Number.isNaN(instant.getTime())) {
    throw new RangeError("kotodoki datetime must be a valid Date, timestamp, or ISO string.");
  }

  return instant;
}

function getSystemTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? DEFAULT_TIMEZONE;
}

function getZonedDateParts(instant: Date, timezone: string): ZonedDateParts {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-gregory", {
    calendar: "gregory",
    numberingSystem: "latn",
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: toNumber(parts.year, "year"),
    month: toNumber(parts.month, "month"),
    day: toNumber(parts.day, "day"),
    weekday: parseWeekday(parts.weekday),
    hour: toNumber(parts.hour, "hour"),
    minute: toNumber(parts.minute, "minute"),
  };
}

function parseWeekday(value: string | undefined): Weekday {
  switch (value) {
    case "Sun":
      return 0;
    case "Mon":
      return 1;
    case "Tue":
      return 2;
    case "Wed":
      return 3;
    case "Thu":
      return 4;
    case "Fri":
      return 5;
    case "Sat":
      return 6;
    default:
      throw new RangeError(`kotodoki could not resolve weekday: ${value ?? "missing"}`);
  }
}

function toNumber(value: string | undefined, label: string): number {
  if (!value) {
    throw new RangeError(`kotodoki could not resolve ${label}.`);
  }

  return Number.parseInt(value, 10);
}

function toMonthDayNumber(value: { month: number; day: number }) {
  return value.month * 100 + value.day;
}

function formatDate(parts: Pick<ZonedDateParts, "year" | "month" | "day">) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
