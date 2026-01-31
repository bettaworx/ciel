import { IBM_Plex_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalSidebar } from "@/components/ConditionalSidebar";
import { MainContent } from "@/components/MainContent";
import { Providers } from "@/providers/providers";
import { AgreementCheckProvider } from "@/components/providers/AgreementCheckProvider";
import { ConfigWatcher } from "@/components/providers/ConfigWatcher";
import { SetupRedirect } from "./SetupRedirect";
import { DynamicTitle } from "@/components/DynamicTitle";
import "./globals.css";

const ibmPlexSansJP = IBM_Plex_Sans_JP({
  variable: "--font-ibm-plex-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${ibmPlexSansJP.className} antialiased`} suppressHydrationWarning>
        <Providers>
          <DynamicTitle titleKey="meta.title" />
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
