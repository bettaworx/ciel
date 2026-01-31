import { defaultLocale, locales, type Locale } from '@/i18n/constants';

export async function loadMessages(locale: Locale): Promise<Record<string, string>> {
	const resolvedLocale = locales.includes(locale) ? locale : defaultLocale;
	const messagesModule = await import(`@/messages/${resolvedLocale}.json`);
	return messagesModule.default;
}
