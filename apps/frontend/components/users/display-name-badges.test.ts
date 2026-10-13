import { describe, expect, it } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

/**
 * The badges beside a display name are labelled only by aria-label, so a
 * missing translation is invisible on screen and leaves the icon announced as
 * whatever the fallback produced. The same is true of the toggle that sets the
 * bot flag, which reports its outcome through a toast.
 *
 * These read the message files directly rather than going through i18next on
 * purpose: i18next falls back to Japanese for a key missing from English (see
 * i18n/index.test.ts), so a key added to ja.json alone still resolves and a
 * test that asked i18next would pass without noticing. Only the raw files can
 * answer whether both languages actually carry the string.
 */
const REQUIRED_KEYS = [
  // aria-labels for the badges DisplayName draws
  "user.privateAccount",
  "user.botAccount",
  "user.mutedAccount",
  "user.blockedAccount",
  // Settings -> Account, the "mark as bot" toggle and its toasts
  "settings.account.bot.title",
  "settings.account.bot.enabled",
  "settings.account.bot.disabled",
  "settings.account.bot.error",
] as const;

function lookup(messages: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (typeof node !== "object" || node === null) return undefined;
    return (node as Record<string, unknown>)[part];
  }, messages);
}

describe("badge and bot-toggle translations", () => {
  for (const [locale, messages] of [
    ["ja", ja],
    ["en", en],
  ] as const) {
    it(`carries every required string in ${locale}.json`, () => {
      for (const key of REQUIRED_KEYS) {
        const value = lookup(messages, key);
        expect(typeof value, `${key} missing from ${locale}.json`).toBe("string");
        expect((value as string).trim().length, `${key} empty in ${locale}.json`).toBeGreaterThan(
          0,
        );
      }
    });
  }

  it("keeps the two languages from sharing a string by accident", () => {
    // Every one of these is prose, so an identical value in both files means
    // one was copied and never translated.
    for (const key of REQUIRED_KEYS) {
      expect(lookup(ja, key), `${key} is untranslated`).not.toBe(lookup(en, key));
    }
  });
});
