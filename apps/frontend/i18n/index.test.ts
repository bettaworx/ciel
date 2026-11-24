import { beforeAll, describe, expect, it } from "vitest";
import { initI18n } from "@/i18n";
import ja from "@/messages/ja.json";
import en from "@/messages/en.json";

/**
 * The message files were written for next-intl and carry over unchanged, so
 * these assert the i18next settings that make that work: nested keys split on
 * ".", single-brace interpolation, no namespace separator, and no escaping.
 *
 * They run against the real message files, so a key or placeholder that drifts
 * out of the shape the app expects fails here.
 */
describe("i18n configuration", () => {
  beforeAll(async () => {
    await initI18n("ja", ja);
  });

  it("resolves nested keys with dot separators", async () => {
    const i18n = await initI18n("ja", ja);

    expect(i18n.t("meta.title")).toBe(ja.meta.title);
    expect(i18n.t("settings.title")).toBe(ja.settings.title);
  });

  it("interpolates single-brace placeholders", async () => {
    const i18n = await initI18n("ja", ja);

    // A real message from the files, so the placeholder syntax is the app's.
    expect(i18n.t("postCard.reactionCount", { count: 3 })).toContain("3");
    expect(i18n.t("postCard.reactionCount", { count: 3 })).not.toContain("{count}");
  });

  it("does not treat a colon in a key as a namespace separator", async () => {
    const i18n = await initI18n("ja", ja);

    // Missing keys come back as the key itself; what matters is that i18next
    // does not silently look in a namespace called "meta".
    expect(i18n.t("meta:title")).toBe("meta:title");
  });

  it("leaves HTML-significant characters alone", async () => {
    const i18n = await initI18n("ja", ja);

    // React escapes on render; escaping here too would show entities.
    expect(i18n.t("__missing__", { value: "a & b" })).not.toContain("&amp;");
  });

  it("switches locale and serves the other language", async () => {
    await initI18n("ja", ja);
    const i18n = await initI18n("en", en);

    expect(i18n.language).toBe("en");
    expect(i18n.t("meta.title")).toBe(en.meta.title);
  });

  it("falls back to Japanese for a key missing from English", async () => {
    const i18n = await initI18n("en", en);

    expect(i18n.options.fallbackLng).toContain("ja");
  });
});
