import { describe, expect, it } from "vitest";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

/**
 * The Apps settings page and the consent screen are where someone decides what
 * may act as their account, and both describe those choices entirely in prose.
 * A missing string there renders as a bare dotted key at exactly the moment a
 * reader most needs to understand what they are agreeing to.
 *
 * These read the message files directly rather than going through i18next,
 * which falls back to Japanese for a key missing from English — so a key added
 * to one file only still resolves, and a test routed through it would pass
 * without noticing.
 */
const REQUIRED_KEYS = [
  // The add picker. Its two choices create quite different things — one for
  // other people to connect to, one a live credential — so the hint lines are
  // load-bearing rather than decoration.
  "settings.account.apps.add",
  "settings.account.apps.addApp",
  "settings.account.apps.addAppHint",
  "settings.account.apps.addToken",
  "settings.account.apps.addTokenHint",
  "settings.account.apps.chooseKind",

  // Personal access tokens.
  "settings.account.apps.tokens",
  "settings.account.apps.noTokens",
  "settings.account.apps.tokenName",
  "settings.account.apps.tokenNameHelp",
  "settings.account.apps.createToken",
  "settings.account.apps.creatingToken",
  "settings.account.apps.tokenCreated",
  "settings.account.apps.tokenOnce",
  "settings.account.apps.revokeToken",
  "settings.account.apps.revokeTokenConfirm",
  "settings.account.apps.tokenRevoked",
  "settings.account.apps.expiresAt",

  // OAuth apps.
  "settings.account.apps.title",
  "settings.account.apps.description",
  "settings.account.apps.yourApps",
  "settings.account.apps.noApps",
  "settings.account.apps.connected",
  "settings.account.apps.noConnected",
  "settings.account.apps.clientSecret",
  "settings.account.apps.secretOnce",
  "settings.account.apps.rotateSecret",
  "settings.account.apps.deleteConfirm",
  "settings.account.apps.disconnect",

  // The consent screen.
  "oauth.authorize.title",
  "oauth.authorize.intro",
  "oauth.authorize.permissions",
  "oauth.authorize.approve",
  "oauth.authorize.deny",
  "oauth.authorize.invalid",
  "oauth.authorize.writeWarning",
] as const;

function lookup(messages: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (typeof node !== "object" || node === null) return undefined;
    return (node as Record<string, unknown>)[part];
  }, messages);
}

describe("OAuth and apps settings translations", () => {
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
    for (const key of REQUIRED_KEYS) {
      expect(lookup(ja, key), `${key} is untranslated`).not.toBe(lookup(en, key));
    }
  });

  // The warning strings are the ones a reader acts on, so they must actually
  // interpolate rather than showing a raw placeholder.
  it("keeps the placeholders the consent screen substitutes", () => {
    for (const [locale, messages] of [
      ["ja", ja],
      ["en", en],
    ] as const) {
      expect(lookup(messages, "oauth.authorize.intro"), `intro in ${locale}`).toContain("{app}");
      expect(lookup(messages, "oauth.authorize.by"), `by in ${locale}`).toContain("{owner}");
    }
  });
});
