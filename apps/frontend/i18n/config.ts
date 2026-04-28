import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, LOCALE_COOKIE_KEY, type Locale } from '@/i18n/constants';

// Re-export for backward compatibility
export { locales, defaultLocale, type Locale };

function normalizeLocale(value: string | null): Locale | undefined {
	if (!value) return undefined;
	const normalized = value.toLowerCase().split('-')[0];
	return locales.includes(normalized as Locale) ? (normalized as Locale) : undefined;
}

// Detect locale from browser's Accept-Language header
function detectLocaleFromHeader(acceptLanguage: string | null): Locale {
	if (!acceptLanguage) return defaultLocale;

	// Parse Accept-Language header
	const languages = acceptLanguage
		.split(',')
		.map((lang) => {
			const [code, q = 'q=1'] = lang.trim().split(';');
			return {
				code: code.split('-')[0], // 'ja-JP' -> 'ja'
				quality: parseFloat(q.replace('q=', '')),
			};
		})
		.sort((a, b) => b.quality - a.quality);

	// Find supported language
	for (const lang of languages) {
		if (locales.includes(lang.code as Locale)) {
			return lang.code as Locale;
		}
	}

	return defaultLocale;
}

// Server-side locale detection
export async function getLocale(): Promise<Locale> {
	const cookieStore = await cookies();
	const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value ?? null);
	if (cookieLocale) {
		return cookieLocale;
	}

	const headersList = await headers();
	const acceptLanguage = headersList.get('accept-language');
	if (acceptLanguage) {
		return detectLocaleFromHeader(acceptLanguage);
	}

	return defaultLocale;
}

// next-intl configuration
export default getRequestConfig(async () => {
	const locale = await getLocale();

	return {
		locale,
		messages: (await import(`../messages/${locale}.json`)).default,
		// Set default timezone to prevent markup mismatches
		// Using 'Asia/Tokyo' as default since the app supports Japanese
		timeZone: 'Asia/Tokyo',
	};
});
