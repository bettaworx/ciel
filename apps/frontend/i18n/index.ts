import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLocale, type Locale } from "@/i18n/constants";

/**
 * i18next configuration matching the message files as they already are.
 *
 * The 44 top-level groups in messages/*.json are treated as key prefixes inside
 * a single namespace, not as i18next namespaces, so `messages/{ja,en}.json`
 * needed no changes at all:
 *
 * - `keySeparator: "."`  — nested lookups like `settings.general.title`.
 * - `nsSeparator: false` — a colon inside a message is text, not a namespace
 *   separator (several messages contain one).
 * - `{name}` interpolation — the message files use single braces; i18next
 *   defaults to double.
 * - `escapeValue: false` — React escapes for us, and double-escaping would
 *   show entities to the reader.
 */
export async function initI18n(locale: Locale, messages: Record<string, unknown>) {
  if (i18next.isInitialized) {
    addMessages(locale, messages);
    await i18next.changeLanguage(locale);
    return i18next;
  }

  await i18next.use(initReactI18next).init({
    lng: locale,
    fallbackLng: defaultLocale,
    resources: { [locale]: { translation: messages } },
    keySeparator: ".",
    nsSeparator: false,
    interpolation: {
      prefix: "{",
      suffix: "}",
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18next;
}

/** Register a locale's messages, replacing any already loaded for it. */
export function addMessages(locale: Locale, messages: Record<string, unknown>) {
  i18next.addResourceBundle(locale, "translation", messages, true, true);
}

export { i18next };
