'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, useAtomValue } from 'jotai';
import { NextIntlClientProvider } from 'next-intl';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ThemeProvider } from '@/providers/theme-provider';
import { RealtimeProvider } from '@/providers/realtime-provider';
import { AuthInitProvider } from '@/providers/auth-init-provider';
import { LoadingScreen } from '@/components/LoadingScreen';
import { authStatusAtom } from '@/atoms/auth';
import { getClientLocale } from '@/i18n/client-locale';
import { loadMessages } from '@/i18n/load-messages';
import type { Locale } from '@/i18n/constants';

interface ProvidersProps {
	children: ReactNode;
}

/**
 * Inner component that monitors auth initialization status
 * Must be inside JotaiProvider to use atoms
 */
function ProvidersWithAuth({ children, onAuthReady }: { children: ReactNode; onAuthReady: () => void }) {
	const authStatus = useAtomValue(authStatusAtom);
	const hasNotifiedRef = useRef(false);

	useEffect(() => {
		// Wait for auth to be ready (either authenticated or not)
		if ((authStatus === 'ready' || authStatus === 'error') && !hasNotifiedRef.current) {
			hasNotifiedRef.current = true;
			onAuthReady();
		}
	}, [authStatus, onAuthReady]);

	return (
		<ThemeProvider>
			<AuthInitProvider>
				<RealtimeProvider>{children}</RealtimeProvider>
			</AuthInitProvider>
		</ThemeProvider>
	);
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
	const [isAuthReady, setIsAuthReady] = useState(false);
	const localeRequestRef = useRef(0);

	// Combined loading state: both locale/messages AND auth must be ready
	const isLoading = !locale || !messages || !isAuthReady;

	const handleAuthReady = useCallback(() => {
		setIsAuthReady(true);
	}, []);

	const refreshLocale = () => {
		const resolvedLocale = getClientLocale();
		const requestId = localeRequestRef.current + 1;
		localeRequestRef.current = requestId;
		loadMessages(resolvedLocale).then((loadedMessages) => {
			if (localeRequestRef.current !== requestId) return;
			document.documentElement.lang = resolvedLocale;
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

	// Show loading screen until both locale AND auth are ready
	if (!locale || !messages) {
		return <LoadingScreen isLoading={true} />;
	}

	return (
		<>
			<LoadingScreen isLoading={isLoading} />
			<JotaiProvider>
				<QueryClientProvider client={queryClient}>
					<NextIntlClientProvider locale={locale} messages={messages}>
						<ProvidersWithAuth onAuthReady={handleAuthReady}>
							{children}
						</ProvidersWithAuth>
					</NextIntlClientProvider>
				</QueryClientProvider>
			</JotaiProvider>
		</>
	);
}

