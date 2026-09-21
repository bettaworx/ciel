import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./redirect";

// The util only reads window.location.origin; stub it instead of pulling in jsdom.
const ORIGIN = "https://app.example";
Object.defineProperty(globalThis, "window", { value: { location: { origin: ORIGIN } } });

describe("getSafeRedirect", () => {
  it("keeps same-origin paths", () => {
    expect(getSafeRedirect("/home?a=1#x")).toBe("/home?a=1#x");
    expect(getSafeRedirect(`${ORIGIN}/home`)).toBe("/home");
  });

  it("falls back for off-origin targets", () => {
    for (const bad of [null, "", "//evil.com", "https://evil.com/x", "javascript:alert(1)"]) {
      expect(getSafeRedirect(bad)).toBe("/");
    }
  });

  it("never returns a target that leaves our origin", () => {
    const hostile = [
      String.raw`/\evil.com`,
      String.raw`\\evil.com`,
      "/%2f%2fevil.com",
      "  //evil.com",
      `${ORIGIN}//evil.com`,
    ];
    for (const bad of hostile) {
      expect(new URL(getSafeRedirect(bad), ORIGIN).origin).toBe(ORIGIN);
    }
  });
});
