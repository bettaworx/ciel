'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ThemeProvider } from '@/providers/theme-provider';
import { RealtimeProvider } from '@/providers/realtime-provider';
import { AuthInitProvider } from '@/providers/auth-init-provider';
import { getClientLocale } from '@/i18n/client-locale';
import { loadMessages } from '@/i18n/load-messages';
import type { Locale } from '@/i18n/constants';

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60, // 1分
						refetchOnWindowFocus: false,
					},
				},
			})
	);
	const [locale, setLocale] = useState<Locale | null>(null);
	const [messages, setMessages] = useState<Record<string, string> | null>(null);
	const localeRequestRef = useRef(0);

	const refreshLocale = () => {
		const resolvedLocale = getClientLocale();
		const requestId = localeRequestRef.current + 1;
		localeRequestRef.current = requestId;
		loadMessages(resolvedLocale).then((loadedMessages) => {
			if (localeRequestRef.current !== requestId) return;
			setLocale(resolvedLocale);
			setMessages(loadedMessages);
		});
	};

	useEffect(() => {
		refreshLocale();
		const handleLocaleChange = () => {
			refreshLocale();
		};
		window.addEventListener('ciel:locale-change', handleLocaleChange);
		return () => {
			window.removeEventListener('ciel:locale-change', handleLocaleChange);
		};
	}, []);

	if (!locale || !messages) {
		return null;
	}

	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<ThemeProvider>
						<AuthInitProvider>
							<RealtimeProvider>{children}</RealtimeProvider>
						</AuthInitProvider>
					</ThemeProvider>
				</NextIntlClientProvider>
			</QueryClientProvider>
		</JotaiProvider>
	);
}

