"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createKotodoki } from "@ciel/kotodoki";
import { frontendKotodokiCatalog } from "@/lib/kotodoki/catalog";

const kotodoki = createKotodoki({
  catalog: frontendKotodokiCatalog,
  categories: ["greet"],
});

function regionFromLocale(locale: string): string {
  return locale.startsWith("en") ? "US" : "JP";
}

export function useComposerPlaceholder(refreshKey = 0): string {
  const t = useTranslations();
  const locale = useLocale();
  const fallback = t("createPost.placeholder");
  const [placeholder, setPlaceholder] = useState(fallback);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const region = regionFromLocale(locale);
    const result = kotodoki.selectPhrase({ locale, region, timezone });
    setPlaceholder(result.selected?.phrase ?? fallback);
  }, [locale, fallback, refreshKey]);

  return placeholder;
}
