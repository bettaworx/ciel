"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { LOCALE_COOKIE_NAME, locales, type Locale } from "@/i18n/constants";
import { Button } from "@/components/ui/button";
import { setSecureCookie } from "@/lib/utils/cookie";

export function LanguageSwitcher() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

	const handleLanguageChange = (newLocale: Locale) => {
		startTransition(() => {
			// Set cookie with Secure flag in production
			setSecureCookie(LOCALE_COOKIE_NAME, newLocale);
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
