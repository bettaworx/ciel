import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import { i18next, initI18n } from "@/i18n";
import { useLocale, useTranslations } from "@/lib/i18n";
import en from "@/messages/en.json";
import ja from "@/messages/ja.json";

/**
 * The app translates through useTranslations, which wraps react-i18next's
 * useTranslation. Rendering on the server needs no DOM, so these go through the
 * real hooks and provider, the way a component does.
 */
function Probe({ values }: { values: Record<string, string | number> }) {
  const t = useTranslations("createPost");
  const tPost = useTranslations("postCard");
  return createElement(
    "p",
    null,
    `${useLocale()}|${t("characterCount", values)}|${tPost("reactionCount", { emoji: "👍", count: 3 })}`,
  );
}

function render(values: Record<string, string | number> = { current: 12, max: 500 }) {
  return renderToStaticMarkup(
    createElement(I18nextProvider, { i18n: i18next }, createElement(Probe, { values })),
  );
}

describe("useTranslations", () => {
  it("resolves prefixed keys and interpolates in the current locale", async () => {
    await initI18n("ja", ja);

    expect(render()).toBe("<p>ja|12/500|👍 3件のリアクション</p>");
  });

  it("follows a switch to another locale", async () => {
    await initI18n("ja", ja);
    await initI18n("en", en);

    expect(render()).toBe("<p>en|12/500|👍 3 reactions</p>");
  });

  // React escapes on render; i18next must not escape first, or the reader
  // sees entities such as &amp;amp; and &#x2F;.
  it("leaves escaping to React", async () => {
    await initI18n("en", en);

    expect(render({ current: "a/b", max: "<b>&</b>" })).toContain("a/b/&lt;b&gt;&amp;&lt;/b&gt;");
  });
});
