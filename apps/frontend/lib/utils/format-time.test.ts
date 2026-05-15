import { describe, expect, it } from "vitest";

import { formatFullTimestamp } from "@/lib/utils/format-time";

describe("formatFullTimestamp", () => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  it("formats a full timestamp using explicit date/time options", () => {
    const date = new Date("2026-05-13T10:30:45Z");

    expect(formatFullTimestamp(date, "ja")).toBe(
      date.toLocaleDateString("ja", options),
    );
    expect(formatFullTimestamp(date, "en")).toBe(
      date.toLocaleDateString("en", options),
    );
  });

  it("accepts ISO date strings", () => {
    const value = "2026-05-13T10:30:45Z";

    expect(formatFullTimestamp(value, "ja")).toBe(
      new Date(value).toLocaleDateString("ja", options),
    );
  });
});
