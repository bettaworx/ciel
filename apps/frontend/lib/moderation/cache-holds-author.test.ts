import { describe, expect, it } from "vitest";
import { cacheHoldsAuthor } from "./cache-holds-author";

function post(username: string, extra: Record<string, unknown> = {}) {
  return { id: crypto.randomUUID(), author: { id: "u", username }, ...extra };
}

function infinite(...pages: unknown[][]) {
  return { pages: pages.map((items) => ({ items })), pageParams: [] };
}

describe("cacheHoldsAuthor", () => {
  it("finds an author inside an infinite timeline", () => {
    const data = infinite([post("alice"), post("bob")], [post("carol")]);
    expect(cacheHoldsAuthor(data, "bob")).toBe(true);
  });

  // The point of the whole predicate: most timelines do not hold the account
  // that changed, and those must not refetch.
  it("leaves a timeline alone when the author is absent", () => {
    const data = infinite([post("alice")], [post("carol")]);
    expect(cacheHoldsAuthor(data, "bob")).toBe(false);
  });

  it("finds an author on a single cached post", () => {
    expect(cacheHoldsAuthor(post("alice"), "alice")).toBe(true);
    expect(cacheHoldsAuthor(post("alice"), "bob")).toBe(false);
  });

  // A quote or boost carries someone else's post, which is exactly the case
  // where their privacy changing matters.
  it("looks inside a quoted post", () => {
    const quote = post("alice", { reference: post("bob") });
    expect(cacheHoldsAuthor(quote, "bob")).toBe(true);
  });

  it("treats a plain page of items like a timeline", () => {
    expect(cacheHoldsAuthor({ items: [post("bob")] }, "bob")).toBe(true);
    expect(cacheHoldsAuthor({ items: [post("alice")] }, "bob")).toBe(false);
  });

  it("says nothing is held when there is no data", () => {
    expect(cacheHoldsAuthor(undefined, "bob")).toBe(false);
    expect(cacheHoldsAuthor(null, "bob")).toBe(false);
  });

  // Refetching something unrelated wastes a request; skipping something that
  // did hold the account leaves content on screen the server has stopped
  // serving. So an unknown shape errs towards refetching.
  it("errs towards refetching an unrecognised shape", () => {
    expect(cacheHoldsAuthor({ stats: { userCount: 3 } }, "bob")).toBe(true);
  });

  it("does not hang on a cyclic cache entry", () => {
    const cyclic: Record<string, unknown> = { items: [] };
    (cyclic.items as unknown[]).push(cyclic);
    expect(cacheHoldsAuthor(cyclic, "bob")).toBe(true);
  });
});
