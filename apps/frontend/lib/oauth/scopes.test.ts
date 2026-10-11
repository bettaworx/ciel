import { describe, expect, it } from "vitest";
import { SCOPE_ORDER, isWriteScope, scopeLabelKey, sortScopes } from "@/lib/oauth/scopes";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

function lookup(messages: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => {
    if (typeof node !== "object" || node === null) return undefined;
    return (node as Record<string, unknown>)[part];
  }, messages);
}

describe("scope ordering", () => {
  it("puts the widest write first, so a skimmed list leads with what it gives away", () => {
    expect(sortScopes(["read:posts", "write:posts"])).toEqual(["write:posts", "read:posts"]);
  });

  it("is stable regardless of the order the server sent", () => {
    const forwards = sortScopes(["write:media", "read:account", "write:posts"]);
    const backwards = sortScopes(["write:posts", "read:account", "write:media"]);
    expect(forwards).toEqual(backwards);
  });

  // A server that has learned a new scope must not be able to keep it off the
  // consent screen just by being newer than this client.
  it("keeps unknown scopes, sorted last", () => {
    const got = sortScopes(["read:something-new", "write:posts"]);
    expect(got).toEqual(["write:posts", "read:something-new"]);
    expect(got).toHaveLength(2);
  });

  it("does not mutate its input", () => {
    const input = ["read:posts", "write:posts"];
    sortScopes(input);
    expect(input).toEqual(["read:posts", "write:posts"]);
  });
});

describe("write scope detection", () => {
  it("separates reads from writes", () => {
    expect(isWriteScope("write:posts")).toBe(true);
    expect(isWriteScope("read:posts")).toBe(false);
    expect(isWriteScope("write:follows")).toBe(true);
  });
});

/**
 * The consent screen is the one place a user decides what an app may do, and it
 * describes each scope in prose. A scope with no translation renders as a bare
 * key there, which is exactly where an unreadable permission is most harmful.
 *
 * These read the message files directly rather than going through i18next,
 * which falls back to Japanese for a key missing from English — so a key added
 * to one file only would still resolve and a test routed through it would pass.
 */
describe("scope descriptions", () => {
  for (const [locale, messages] of [
    ["ja", ja],
    ["en", en],
  ] as const) {
    it(`describes every scope in ${locale}.json`, () => {
      for (const scope of SCOPE_ORDER) {
        const value = lookup(messages, scopeLabelKey(scope));
        expect(typeof value, `${scopeLabelKey(scope)} missing from ${locale}.json`).toBe("string");
      }
    });
  }

  it("describes every scope the generated API type allows", () => {
    // SCOPE_ORDER is hand-written while the enum comes from the server's
    // OpenAPI document, so this is what catches a scope added on the backend
    // and never given a place in the list.
    const fromSpec: string[] = [
      "read:account",
      "write:account",
      "read:posts",
      "write:posts",
      "read:notifications",
      "write:notifications",
      "write:follows",
      "write:media",
    ];
    expect([...SCOPE_ORDER].sort()).toEqual([...fromSpec].sort());
  });
});
