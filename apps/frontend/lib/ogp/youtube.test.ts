import { describe, it, expect } from "vitest";
import { parseYoutubeUrl, getYoutubeEmbedUrl } from "@/lib/ogp/youtube";

describe("parseYoutubeUrl", () => {
  it("parses a watch URL", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/watch?v=bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a watch URL with extra query parameters", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/watch?v=bVSqBkeLSzY&list=PL123&t=30s")).toEqual(
      {
        videoId: "bVSqBkeLSzY",
      },
    );
  });

  it("parses a watch URL without www", () => {
    expect(parseYoutubeUrl("https://youtube.com/watch?v=bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a mobile watch URL", () => {
    expect(parseYoutubeUrl("https://m.youtube.com/watch?v=bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a short URL", () => {
    expect(parseYoutubeUrl("https://youtu.be/bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a short URL with query parameters", () => {
    expect(parseYoutubeUrl("https://youtu.be/bVSqBkeLSzY?si=abc123")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses an embed URL", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/embed/bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a Shorts URL", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/shorts/bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a live URL", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/live/bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a YouTube Music URL", () => {
    expect(parseYoutubeUrl("https://music.youtube.com/watch?v=bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("parses a youtube-nocookie embed URL", () => {
    expect(parseYoutubeUrl("https://www.youtube-nocookie.com/embed/bVSqBkeLSzY")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("ignores hash fragments", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/watch?v=bVSqBkeLSzY#t=10s")).toEqual({
      videoId: "bVSqBkeLSzY",
    });
  });

  it("returns null for an invalid video ID", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/watch?v=too-short")).toBeNull();
  });

  it("returns null for a channel URL", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/@username")).toBeNull();
  });

  it("returns null for a playlist URL", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/playlist?list=PL123")).toBeNull();
  });

  it("returns null for a non-YouTube domain", () => {
    expect(parseYoutubeUrl("https://example.com/watch?v=bVSqBkeLSzY")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parseYoutubeUrl("")).toBeNull();
  });
});

describe("getYoutubeEmbedUrl", () => {
  it("returns the privacy-enhanced embed URL", () => {
    expect(getYoutubeEmbedUrl("bVSqBkeLSzY")).toBe(
      "https://www.youtube-nocookie.com/embed/bVSqBkeLSzY",
    );
  });
});
