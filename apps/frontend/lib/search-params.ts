import { z } from "zod";

/**
 * Search-parameter helpers for TanStack Router.
 *
 * The router JSON-parses every search value, so `?expandAncestors=1` arrives as
 * the number 1 and `?flag=true` as a boolean. A `z.string()` schema rejects
 * those, and coercing to a string makes the router re-serialize the URL with
 * quotes (`?expandAncestors="1"`) — which would change links the app generates
 * and shares.
 *
 * So validation accepts whatever the parser produced, leaving the URL
 * byte-identical, and reading converts at the point of use.
 */
export const textSearchParam = z.union([z.string(), z.number(), z.boolean()]).optional();

export type TextSearchParam = z.infer<typeof textSearchParam>;

/** Read a search parameter as text, whatever the parser made of it. */
export function asText(value: TextSearchParam): string | undefined {
  return value == null ? undefined : String(value);
}
