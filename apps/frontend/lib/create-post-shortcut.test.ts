import { describe, expect, it } from "vitest";
import { isCreatePostShortcut } from "@/lib/create-post-shortcut";

const keyEvent = {
  key: "n",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  isComposing: false,
  repeat: false,
  defaultPrevented: false,
};

describe("isCreatePostShortcut", () => {
  it.each(["n", "N"])("opens for %s outside an editor", (key) => {
    expect(isCreatePostShortcut({ ...keyEvent, key }, null)).toBe(true);
    expect(
      isCreatePostShortcut({ ...keyEvent, key }, { tagName: "BUTTON", isContentEditable: false }),
    ).toBe(true);
  });

  it("ignores other keys", () => {
    expect(isCreatePostShortcut({ ...keyEvent, key: "Enter" }, null)).toBe(false);
  });

  it.each(["ctrlKey", "metaKey", "altKey", "isComposing", "repeat", "defaultPrevented"] as const)(
    "ignores events with %s",
    (flag) => {
      expect(isCreatePostShortcut({ ...keyEvent, [flag]: true }, null)).toBe(false);
    },
  );

  it.each(["INPUT", "TEXTAREA", "SELECT"])("leaves typing in %s alone", (tagName) => {
    expect(isCreatePostShortcut(keyEvent, { tagName, isContentEditable: false })).toBe(false);
  });

  it("leaves contenteditable elements and their descendants alone", () => {
    expect(isCreatePostShortcut(keyEvent, { tagName: "SPAN", isContentEditable: true })).toBe(
      false,
    );
  });
});
