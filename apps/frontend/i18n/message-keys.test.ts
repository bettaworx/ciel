import { describe, expect, it } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

/**
 * Every literal key passed to a `useTranslations` getter must name a string in
 * both message files. i18next answers a missing key with the key itself and an
 * object key with its key name, so neither fails at runtime: the raw key just
 * shows up on screen.
 *
 * ponytail: regex scan, so it only sees `const x = useTranslations("prefix")`
 * followed by `x("literal")`. Keys built at runtime are not checked.
 */
const sources = import.meta.glob<string>(
  ["../**/*.{ts,tsx}", "!../**/node_modules/**", "!../**/*.test.ts", "!../**/*.stories.tsx"],
  { query: "?raw", import: "default", eager: true },
);

function lookup(messages: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      messages,
    );
}

function literalKeys(): string[] {
  const keys: string[] = [];
  for (const [file, source] of Object.entries(sources)) {
    const getters = source.matchAll(/const\s+(\w+)\s*=\s*useTranslations\(\s*(?:"([^"]*)")?\s*\)/g);
    for (const [, name, prefix] of getters) {
      for (const [, key] of source.matchAll(new RegExp(String.raw`\b${name}\(\s*"([^"]+)"`, "g"))) {
        keys.push(`${file}: ${prefix ? `${prefix}.${key}` : key}`);
      }
    }
  }
  return keys;
}

describe("translation keys used in source", () => {
  const keys = literalKeys();

  it("finds the keys it is meant to check", () => {
    // Guards the scan itself: a broken glob or regex would pass vacuously.
    expect(keys.length).toBeGreaterThan(500);
  });

  it.each([
    ["ja", ja],
    ["en", en],
  ])("resolve to strings in %s", (_, messages) => {
    const broken = keys.filter((entry) => {
      const key = entry.slice(entry.indexOf(": ") + 2);
      return typeof lookup(messages, key) !== "string";
    });
    expect(broken).toEqual([]);
  });
});
