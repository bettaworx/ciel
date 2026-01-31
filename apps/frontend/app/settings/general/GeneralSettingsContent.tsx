"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingItem } from "@/components/settings/SettingItem";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { LOCALE_COOKIE_NAME, locales, type Locale } from "@/i18n/constants";
import { getCookie, setSecureCookie } from "@/lib/utils/cookie";

// Get current locale from cookie
function getCurrentLocale(): Locale {
  if (typeof document === "undefined") return "ja";
  const locale = getCookie(LOCALE_COOKIE_NAME);
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return "ja";
}

export function GeneralSettingsContent() {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState<Locale>(getCurrentLocale());

	const handleLanguageChange = (newLocale: Locale) => {
		setLocale(newLocale);
		startTransition(() => {
			// Set cookie with Secure flag in production
			setSecureCookie(LOCALE_COOKIE_NAME, newLocale);
			window.dispatchEvent(new Event('ciel:locale-change'));
		});
	};

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.general.title" />

      <SettingItem
        title={t("settings.general.language.title")}
        description={t("settings.general.language.description")}
      >
        <Select
          value={locale}
          onValueChange={handleLanguageChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={t("settings.general.language.placeholder")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ja">{t("settings.language.ja")}</SelectItem>
            <SelectItem value="en">{t("settings.language.en")}</SelectItem>
          </SelectContent>
        </Select>
      </SettingItem>
    </div>
  );
}
