import { IBM_Plex_Sans_JP } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalSidebar } from "@/components/ConditionalSidebar";
import { MainContent } from "@/components/MainContent";
import { Providers } from "@/providers/providers";
import { AgreementCheckProvider } from "@/components/providers/AgreementCheckProvider";
import { ConfigWatcher } from "@/components/providers/ConfigWatcher";
import { SetupRedirect } from "./SetupRedirect";
import { DynamicTitle } from "@/components/DynamicTitle";
import { ThemeColorMeta } from "@/components/ThemeColorMeta";
import { RegisterServiceWorker } from "@/app/register-sw";
import "./globals.css";

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  variable: "--font-ibm-plex-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading headers opts into dynamic rendering per request, which is required
  // for per-request nonces. Next.js uses the x-nonce header (set by middleware)
  // to apply the nonce to its own generated script tags.
  await headers();
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/pwa/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ciel" />
        <link rel="apple-touch-icon" href="/pwa/icon-192" />
      </head>
      <body className={`${ibmPlexSansJP.className} antialiased`} suppressHydrationWarning>
        <Providers>
          <DynamicTitle titleKey="meta.title" />
          <ThemeColorMeta />
          <RegisterServiceWorker />
          <AgreementCheckProvider>
            <ConfigWatcher />
            <SetupRedirect />
            <ConditionalSidebar />
            <MainContent>{children}</MainContent>
            <Toaster />
          </AgreementCheckProvider>
        </Providers>
      </body>
    </html>
  );
}
