// Shared locale constants that can be used in both client and server components
export const locales = ['ja', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

// Local storage key for persisted locale
export const LOCALE_STORAGE_KEY = 'ciel:locale';

// Cookie key for persisted locale that the server can read during SSR
export const LOCALE_COOKIE_KEY = 'NEXT_LOCALE';
