"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { type Locale } from "@/i18n/constants";
import { Button } from "@/components/ui/button";
import { setClientLocale } from "@/i18n/client-locale";

export function LanguageSwitcher() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

	const handleLanguageChange = (newLocale: Locale) => {
		startTransition(() => {
			setClientLocale(newLocale);
			window.dispatchEvent(new Event('ciel:locale-change'));
		});
	};

  return (
    <div className="flex gap-4">
      <Button
        variant="default"
        onClick={() => handleLanguageChange("ja")}
        disabled={isPending}
      >
        {t("language.japanese")}
      </Button>
      <Button
        variant="default"
        onClick={() => handleLanguageChange("en")}
        disabled={isPending}
      >
        {t("language.english")}
      </Button>
    </div>
  );
}
