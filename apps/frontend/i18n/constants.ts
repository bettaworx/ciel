// Shared locale constants that can be used in both client and server components
export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

// Cookie name constant
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
