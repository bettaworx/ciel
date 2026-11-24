import { describe, expect, it } from "vitest";
import {
  buildAdminEmojiCreateFormData,
  buildAdminEmojiUpdateFormData,
  getAdminEmojiFormDefaults,
  isValidEmojiShortcode,
} from "@/lib/admin-emojis";

describe("admin emoji helpers", () => {
  it("validates shortcode format", () => {
    expect(isValidEmojiShortcode("blob_cat")).toBe(true);
    expect(isValidEmojiShortcode("blob-cat")).toBe(false);
    expect(isValidEmojiShortcode("blob cat")).toBe(false);
  });

  it("builds defaults from an existing emoji", () => {
    expect(
      getAdminEmojiFormDefaults({
        shortcode: "blobcat",
        name: "Blob Cat",
        category: "cats",
        license: "CC BY",
      }),
    ).toEqual({
      shortcode: "blobcat",
      name: "Blob Cat",
      category: "cats",
      license: "CC BY",
      imageFile: null,
    });
  });

  it("requires an image for create form data", () => {
    expect(() =>
      buildAdminEmojiCreateFormData({
        shortcode: "blobcat",
        name: "",
        category: "",
        license: "",
        imageFile: null,
      }),
    ).toThrow("image file is required");
  });

  it("builds create form data with optional fields omitted when empty", () => {
    const file = new File(["emoji"], "blobcat.png", { type: "image/png" });
    const form = buildAdminEmojiCreateFormData({
      shortcode: " blobcat ",
      name: " ",
      category: "cats",
      license: "",
      imageFile: file,
    });

    expect(form.get("shortcode")).toBe("blobcat");
    expect(form.get("name")).toBeNull();
    expect(form.get("category")).toBe("cats");
    expect(form.get("license")).toBeNull();
    expect(form.get("image")).toBeInstanceOf(File);
    expect((form.get("image") as File).name).toBe("blobcat.png");
    // The very same File, not a copy: passing a filename to FormData.set()
    // constructs a new one, which loses the mark normalizeForUpload leaves on
    // its output and makes the upload path convert the file a second time.
    expect(form.get("image")).toBe(file);
  });

  it("builds update form data with explicit clear flags", () => {
    const form = buildAdminEmojiUpdateFormData({
      shortcode: "blobcat",
      name: "",
      category: " reactions ",
      license: "",
      imageFile: null,
    });

    expect(form.get("shortcode")).toBe("blobcat");
    expect(form.get("name")).toBe("");
    expect(form.get("setName")).toBe("true");
    expect(form.get("category")).toBe("reactions");
    expect(form.get("setCategory")).toBe("true");
    expect(form.get("license")).toBe("");
    expect(form.get("setLicense")).toBe("true");
    expect(form.get("image")).toBeNull();
  });
});
