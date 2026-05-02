"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { selectPhrase } from "@ciel/kotodoki";

function regionFromLocale(locale: string): string {
  return locale.startsWith("en") ? "US" : "JP";
}

export function useComposerPlaceholder(): string {
  const t = useTranslations();
  const locale = useLocale();
  const fallback = t("createPost.placeholder");
  const [placeholder, setPlaceholder] = useState(fallback);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const region = regionFromLocale(locale);
    const result = selectPhrase({ locale, region, timezone });
    if (result.selected) {
      setPlaceholder(result.selected.phrase);
    }
  }, [locale, fallback]);

  return placeholder;
}
