import { describe, expect, it } from "vitest";
import { resolveKotodokiContext } from "../src/index.js";

describe("resolveKotodokiContext", () => {
  it("resolves date parts in the requested timezone", () => {
    const context = resolveKotodokiContext({
      datetime: "2026-01-01T00:30:00.000Z",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(context.date).toBe("2026-01-01");
    expect(context.hour).toBe(9);
    expect(context.weekday).toBe(4);
  });

  it("uses month-based seasons for the initial Japan dataset", () => {
    const context = resolveKotodokiContext({
      datetime: "2026-04-15T12:00:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(context.season).toBe("spring");
  });

  it("resolves fixed-date and range holidays for Japan", () => {
    const tanabata = resolveKotodokiContext({
      datetime: "2026-07-07T12:00:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });
    const obon = resolveKotodokiContext({
      datetime: "2026-08-15T12:00:00+09:00",
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      region: "JP",
    });

    expect(tanabata.holidayIds).toContain("tanabata");
    expect(obon.holidayIds).toContain("obon");
  });
});
