import { defaultLocale, LOCALE_COOKIE_KEY, LOCALE_STORAGE_KEY, locales, type Locale } from '@/i18n/constants';
import { getCookie, setSecureCookie } from '@/lib/utils/cookie';

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

function getCookieLocale(): Locale | undefined {
	const cookieLocale = getCookie(LOCALE_COOKIE_KEY);
	if (!cookieLocale) return undefined;
	return normalizeLocale(cookieLocale);
}

function setCookieLocale(locale: Locale): void {
	setSecureCookie(LOCALE_COOKIE_KEY, locale);
}

function applyDocumentLocale(locale: Locale): void {
	if (typeof document === 'undefined') return;
	document.documentElement.lang = locale;
}

export function getClientLocale(): Locale {
	const storedLocale = getStoredLocale();
	if (storedLocale) {
		const normalized = normalizeLocale(storedLocale);
		if (normalized) {
			setCookieLocale(normalized);
			applyDocumentLocale(normalized);
			return normalized;
		}
	}

	const cookieLocale = getCookieLocale();
	if (cookieLocale) {
		setStoredLocale(cookieLocale);
		applyDocumentLocale(cookieLocale);
		return cookieLocale;
	}

	if (typeof navigator !== 'undefined') {
		const languages = navigator.languages && navigator.languages.length > 0
			? navigator.languages
			: [navigator.language];
		for (const language of languages) {
			const normalized = normalizeLocale(language);
			if (normalized) {
				setStoredLocale(normalized);
				setCookieLocale(normalized);
				applyDocumentLocale(normalized);
				return normalized;
			}
		}
	}

	setStoredLocale(defaultLocale);
	setCookieLocale(defaultLocale);
	applyDocumentLocale(defaultLocale);
	return defaultLocale;
}

export function setClientLocale(locale: Locale): void {
	setStoredLocale(locale);
	setCookieLocale(locale);
	applyDocumentLocale(locale);
}
