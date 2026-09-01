import type { components } from "@/lib/api/api";

type AdminEmoji = components["schemas"]["AdminEmoji"];

export type AdminEmojiFormValues = {
  shortcode: string;
  name: string;
  category: string;
  license: string;
  imageFile: File | null;
};

const EMOJI_SHORTCODE_PATTERN = /^[A-Za-z0-9_]+$/;

function trimOptional(value: string): string {
  return value.trim();
}

export function isValidEmojiShortcode(value: string): boolean {
  return EMOJI_SHORTCODE_PATTERN.test(value.trim());
}

export function getAdminEmojiFormDefaults(
  emoji?: Pick<AdminEmoji, "shortcode" | "name" | "category" | "license">,
): AdminEmojiFormValues {
  return {
    shortcode: emoji?.shortcode ?? "",
    name: emoji?.name ?? "",
    category: emoji?.category ?? "",
    license: emoji?.license ?? "",
    imageFile: null,
  };
}

export function buildAdminEmojiCreateFormData(
  values: AdminEmojiFormValues,
): FormData {
  if (!values.imageFile) {
    throw new Error("image file is required");
  }

  const form = new FormData();
  form.set("shortcode", values.shortcode.trim());

  const name = trimOptional(values.name);
  const category = trimOptional(values.category);
  const license = trimOptional(values.license);

  if (name) form.set("name", name);
  if (category) form.set("category", category);
  if (license) form.set("license", license);

  form.set("image", values.imageFile);
  return form;
}

export function buildAdminEmojiUpdateFormData(
  values: AdminEmojiFormValues,
): FormData {
  const form = new FormData();
  const shortcode = values.shortcode.trim();
  const name = trimOptional(values.name);
  const category = trimOptional(values.category);
  const license = trimOptional(values.license);

  if (shortcode) {
    form.set("shortcode", shortcode);
  }

  form.set("name", name);
  form.set("setName", "true");
  form.set("category", category);
  form.set("setCategory", "true");
  form.set("license", license);
  form.set("setLicense", "true");

  if (values.imageFile) {
    form.set("image", values.imageFile);
  }

  return form;
}
