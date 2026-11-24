import type { components } from "@/lib/api/api";

export type OAuthScope = components["schemas"]["OAuthScope"];

/**
 * Every scope the server issues, in the order a consent screen should list
 * them.
 *
 * Ordered by how much the scope gives away rather than alphabetically: someone
 * skimming a consent screen reads the top of the list, so "can post as you"
 * must not sit below "can read your timeline" just because of where a letter
 * falls. Reads come before the writes they pair with, and the widest write
 * comes first.
 */
export const SCOPE_ORDER: readonly OAuthScope[] = [
  "write:posts",
  "read:posts",
  "write:account",
  "read:account",
  "write:follows",
  "write:media",
  "write:notifications",
  "read:notifications",
] as const;

/**
 * Scopes that let an app change something, as opposed to only look at it.
 * The consent screen marks these, because "reads your posts" and "posts as
 * you" are not the same decision and the scope strings alone do not make that
 * obvious at a glance.
 */
export function isWriteScope(scope: string): boolean {
  return scope.startsWith("write:");
}

/**
 * The i18n key describing a scope in plain language.
 *
 * Built from the scope rather than kept in a lookup table so a scope added to
 * the server cannot silently render as a blank line — the key resolves or it
 * does not, and the missing-key test says which.
 */
export function scopeLabelKey(scope: string): string {
  return `oauth.scopes.${scope}`;
}

/**
 * Sorts scopes into SCOPE_ORDER.
 *
 * Anything unrecognised sorts last rather than being dropped: a server that has
 * learned a new scope must not be able to hide it from the consent screen by
 * being newer than the client.
 */
export function sortScopes(scopes: readonly string[]): string[] {
  return [...scopes].sort((a, b) => {
    const ia = SCOPE_ORDER.indexOf(a as OAuthScope);
    const ib = SCOPE_ORDER.indexOf(b as OAuthScope);
    const ra = ia === -1 ? SCOPE_ORDER.length : ia;
    const rb = ib === -1 ? SCOPE_ORDER.length : ib;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}
