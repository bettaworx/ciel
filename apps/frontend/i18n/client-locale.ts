import { defaultLocale, LOCALE_STORAGE_KEY, locales, type Locale } from '@/i18n/constants';

function normalizeLocale(value: string): Locale | undefined {
	const normalized = value.toLowerCase().split('-')[0];
	return locales.includes(normalized as Locale) ? (normalized as Locale) : undefined;
}

function getStoredLocale(): string | null {
	if (typeof window === 'undefined') return null;
	return window.localStorage.getItem(LOCALE_STORAGE_KEY);
}

function setStoredLocale(locale: Locale): void {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function getClientLocale(): Locale {
	const storedLocale = getStoredLocale();
	if (storedLocale) {
		const normalized = normalizeLocale(storedLocale);
		if (normalized) return normalized;
	}

	if (typeof navigator !== 'undefined') {
		const languages = navigator.languages && navigator.languages.length > 0
			? navigator.languages
			: [navigator.language];
		for (const language of languages) {
			const normalized = normalizeLocale(language);
			if (normalized) {
				setStoredLocale(normalized);
				return normalized;
			}
		}
	}

	setStoredLocale(defaultLocale);
	return defaultLocale;
}

export function setClientLocale(locale: Locale): void {
	setStoredLocale(locale);
}
