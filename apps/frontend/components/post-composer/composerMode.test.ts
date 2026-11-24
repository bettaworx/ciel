import { describe, expect, it } from "vitest";
import { shouldShowComposerModeSwitch } from "./composerMode";

describe("shouldShowComposerModeSwitch", () => {
  it.each([
    ["empty text composer", "text", "", false, true],
    ["text content", "text", "hello", false, false],
    ["whitespace content", "text", " ", false, false],
    ["attached media", "text", "", true, false],
    ["drawing with text and media", "drawing", "hello", true, true],
  ] as const)("handles %s", (_case, mode, content, hasMedia, expected) => {
    expect(shouldShowComposerModeSwitch(mode, content, hasMedia)).toBe(expected);
  });
});
