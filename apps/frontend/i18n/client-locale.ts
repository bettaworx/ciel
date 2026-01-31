import { defaultLocale, LOCALE_COOKIE_NAME, locales, type Locale } from '@/i18n/constants';

function getCookieValue(name: string): string | undefined {
	if (typeof document === 'undefined') return undefined;
	const match = document.cookie
		.split(';')
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith(`${name}=`));
	return match ? decodeURIComponent(match.split('=')[1]) : undefined;
}

function normalizeLocale(value: string): Locale | undefined {
	const normalized = value.toLowerCase().split('-')[0];
	return locales.includes(normalized as Locale) ? (normalized as Locale) : undefined;
}

export function getClientLocale(): Locale {
	const cookieLocale = getCookieValue(LOCALE_COOKIE_NAME);
	if (cookieLocale) {
		const normalized = normalizeLocale(cookieLocale);
		if (normalized) return normalized;
	}

	if (typeof navigator !== 'undefined') {
		const languages = navigator.languages && navigator.languages.length > 0
			? navigator.languages
			: [navigator.language];
		for (const language of languages) {
			const normalized = normalizeLocale(language);
			if (normalized) return normalized;
		}
	}

	return defaultLocale;
}
