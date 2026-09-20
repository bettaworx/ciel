"use client";

/**
 * Translation compatibility layer over react-i18next.
 *
 * ~148 files call `useTranslations()`, so this keeps next-intl's surface — a
 * scoped getter that takes a key and an optional values object — and implements
 * it on i18next. Only import paths changed in the migration.
 *
 * The app only ever used `useTranslations` and `useLocale`: no `t.rich`,
 * `t.raw`, `t.markup` or `useFormatter`, and no ICU plural/select messages.
 * That is why i18next needs no ICU plugin here.
 */

import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { defaultLocale, type Locale } from "@/i18n/constants";

export type TranslationValues = Record<string, string | number | Date>;

/** A scoped translation getter, as returned by next-intl's useTranslations. */
export type Translator = (key: string, values?: TranslationValues) => string;

/**
 * Drop-in replacement for `useTranslations` from next-intl.
 *
 * With a prefix, keys are resolved relative to it: `useTranslations("settings")`
 * then `t("title")` reads `settings.title`. Without one, keys are absolute.
 */
export function useTranslations(prefix?: string): Translator {
  const { t, i18n } = useTranslation();

  // i18n.language is in the deps so the memo is discarded on a locale switch;
  // i18next's own `t` identity does not always change.
  return useMemo(
    () => (key: string, values?: TranslationValues) =>
      t(prefix ? `${prefix}.${key}` : key, values ?? {}),
    [t, prefix, i18n.language],
  );
}

/** Drop-in replacement for `useLocale` from next-intl. */
export function useLocale(): Locale {
  const { i18n } = useTranslation();

  return (i18n.language as Locale) || defaultLocale;
}
