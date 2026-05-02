export type Season = "spring" | "summer" | "autumn" | "winter";

export type DayPeriod =
  | "late_night"
  | "morning"
  | "noon"
  | "afternoon"
  | "evening"
  | "night";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RandomSource = () => number;

export type MonthDay = {
  month: number;
  day: number;
};

export type HolidayMatch =
  | ({ type: "date" } & MonthDay)
  | {
      type: "dateRange";
      start: MonthDay;
      end: MonthDay;
    };

export type HolidayEntry = {
  id: string;
  locales: readonly string[];
  regions?: readonly string[];
  match: HolidayMatch;
  tags?: readonly string[];
};

export type HourRange = readonly [startHour: number, endHour: number];

export type PhraseConditions = {
  months?: readonly number[];
  weekdays?: readonly Weekday[];
  hours?: HourRange;
  seasons?: readonly Season[];
  holidays?: readonly string[];
  dayPeriods?: readonly DayPeriod[];
};

export type PhraseEntry = {
  id: string;
  locales: readonly string[];
  regions?: readonly string[];
  conditions?: PhraseConditions;
  phrase: string;
  tags?: readonly string[];
};

export type KotodokiDataset = {
  id: string;
  locale: string;
  region: string;
  holidays: readonly HolidayEntry[];
  phrases: readonly PhraseEntry[];
};

export type KotodokiInput = {
  locale?: string;
  region?: string;
  datetime?: Date | string | number;
  timezone?: string;
};

export type ResolvedKotodokiContext = {
  input: Required<KotodokiInput>;
  locale: string;
  region: string;
  timezone: string;
  instant: Date;
  date: string;
  year: number;
  month: number;
  day: number;
  weekday: Weekday;
  hour: number;
  minute: number;
  season: Season;
  dayPeriod: DayPeriod;
  holidays: readonly HolidayEntry[];
  holidayIds: readonly string[];
};

export type SelectionReason = "matched" | "fallback" | "none";

export type KotodokiSelection = {
  context: ResolvedKotodokiContext;
  matched: readonly PhraseEntry[];
  fallbacks: readonly PhraseEntry[];
  selected: PhraseEntry | null;
  reason: SelectionReason;
};

export type KotodokiOptions = {
  datasets?: readonly KotodokiDataset[];
  defaultLocale?: string;
  defaultRegion?: string;
  defaultTimezone?: string;
  rng?: RandomSource;
};

export type SelectPhraseOptions = {
  rng?: RandomSource;
};

export type Kotodoki = {
  resolveContext(input?: KotodokiInput): ResolvedKotodokiContext;
  getMatchingPhrases(input?: KotodokiInput): readonly PhraseEntry[];
  selectPhrase(
    input?: KotodokiInput,
    options?: SelectPhraseOptions,
  ): KotodokiSelection;
};
