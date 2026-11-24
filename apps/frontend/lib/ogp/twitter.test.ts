import { describe, it, expect } from "vitest";
import { parseTwitterUrl, getTwitterCanonicalUrl } from "@/lib/ogp/twitter";

describe("parseTwitterUrl", () => {
  it("parses an x.com tweet URL", () => {
    expect(parseTwitterUrl("https://x.com/nekochanfood/status/2099740065023111323")).toEqual({
      username: "nekochanfood",
      tweetId: "2099740065023111323",
    });
  });

  it("parses a twitter.com tweet URL", () => {
    expect(parseTwitterUrl("https://twitter.com/nekochanfood/status/2099740065023111323")).toEqual({
      username: "nekochanfood",
      tweetId: "2099740065023111323",
    });
  });

  it("parses a URL with www subdomain", () => {
    expect(parseTwitterUrl("https://www.x.com/nekochanfood/status/2099740065023111323")).toEqual({
      username: "nekochanfood",
      tweetId: "2099740065023111323",
    });
  });

  it("parses a mobile twitter URL", () => {
    expect(
      parseTwitterUrl("https://mobile.twitter.com/nekochanfood/status/2099740065023111323"),
    ).toEqual({
      username: "nekochanfood",
      tweetId: "2099740065023111323",
    });
  });

  it("parses a URL with query parameters", () => {
    expect(
      parseTwitterUrl("https://x.com/nekochanfood/status/2099740065023111323?s=20&t=abc123"),
    ).toEqual({
      username: "nekochanfood",
      tweetId: "2099740065023111323",
    });
  });

  it("parses a URL with a hash fragment", () => {
    expect(parseTwitterUrl("https://x.com/nekochanfood/status/2099740065023111323#m")).toEqual({
      username: "nekochanfood",
      tweetId: "2099740065023111323",
    });
  });

  it("returns null for a profile URL", () => {
    expect(parseTwitterUrl("https://x.com/nekochanfood")).toBeNull();
  });

  it("returns null for a non-twitter domain", () => {
    expect(
      parseTwitterUrl("https://example.com/nekochanfood/status/2099740065023111323"),
    ).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseTwitterUrl("")).toBeNull();
  });
});

describe("getTwitterCanonicalUrl", () => {
  it("returns the canonical x.com URL", () => {
    expect(
      getTwitterCanonicalUrl({ username: "nekochanfood", tweetId: "2099740065023111323" }),
    ).toBe("https://x.com/nekochanfood/status/2099740065023111323");
  });
});
