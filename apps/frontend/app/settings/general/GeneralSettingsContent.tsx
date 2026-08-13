"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Languages } from "lucide-react";
import {
  SettingsRowGroup,
  SettingsSelectRow,
} from "@/components/settings/SettingsRow";
import { PageHeader } from "@/components/shared/PageHeader";
import { LOCALE_STORAGE_KEY, locales, defaultLocale, type Locale } from "@/i18n/constants";
import { setClientLocale } from "@/i18n/client-locale";

// Get current locale from local storage
function getCurrentLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return defaultLocale;
}

export function GeneralSettingsContent() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState<Locale>(getCurrentLocale());

	const handleLanguageChange = (newLocale: Locale) => {
		setLocale(newLocale);
		startTransition(() => {
			setClientLocale(newLocale);
			window.dispatchEvent(new Event('ciel:locale-change'));
		});
	};

  return (
    <>
      <PageHeader backHref="/settings" showBackButton="mobile">
        {t("settings.general.title")}
      </PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <SettingsSelectRow
            icon={Languages}
            label={t("settings.general.language.title")}
            value={locale}
            options={[
              { value: "ja", label: t("settings.language.ja") },
              { value: "en", label: t("settings.language.en") },
            ]}
            onValueChange={handleLanguageChange}
            disabled={isPending}
          />
        </SettingsRowGroup>
      </div>
    </>
  );
}
