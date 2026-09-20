import { describe, expect, it } from "vitest";
import { z } from "zod";
import { asText, textSearchParam } from "@/lib/search-params";

/**
 * TanStack Router parses search values with JSON.parse, so a schema that only
 * accepts strings throws SearchParamError on `?expandAncestors=1` — and
 * coercing to a string makes the router rewrite the URL as `="1"`, quotes and
 * all, breaking links the app generates.
 *
 * These pin both halves: validation accepts what the parser produced, and the
 * value survives unchanged so the URL round-trips.
 */
describe("textSearchParam", () => {
  const schema = z.object({ value: textSearchParam });

  it("accepts a string", () => {
    expect(schema.parse({ value: "posts" })).toEqual({ value: "posts" });
  });

  it("accepts a number, as an all-digits value arrives", () => {
    expect(schema.parse({ value: 1 })).toEqual({ value: 1 });
  });

  it("accepts a boolean, as ?flag=true arrives", () => {
    expect(schema.parse({ value: true })).toEqual({ value: true });
  });

  it("accepts the parameter being absent", () => {
    expect(schema.parse({})).toEqual({});
  });

  // The value has to come back out of validation untouched, or the router
  // re-serializes the URL into something other than what was linked to.
  it("leaves values unchanged so the URL round-trips", () => {
    for (const value of ["posts", "123", 1, 0, true]) {
      expect(schema.parse({ value }).value).toBe(value);
    }
  });

  it("rejects a shape the parser cannot produce for a text param", () => {
    expect(() => schema.parse({ value: { nested: true } })).toThrow();
  });
});

describe("asText", () => {
  it("reads every parsed form back as text", () => {
    expect(asText("posts")).toBe("posts");
    expect(asText(1)).toBe("1");
    expect(asText(0)).toBe("0");
    expect(asText(true)).toBe("true");
  });

  it("keeps an absent parameter absent rather than making it a string", () => {
    expect(asText(undefined)).toBeUndefined();
  });

  // The flag is read as `asText(v) === "1"`, so both spellings must work.
  it("makes the expandAncestors check work for either spelling", () => {
    expect(asText(1) === "1").toBe(true);
    expect(asText("1") === "1").toBe(true);
    expect(asText(undefined) === "1").toBe(false);
    expect(asText(0) === "1").toBe(false);
  });
});
