import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalSidebar } from "@/components/ConditionalSidebar";
import { MainContent } from "@/components/MainContent";
import { Providers } from "@/providers/providers";
import { AgreementCheckProvider } from "@/components/providers/AgreementCheckProvider";
import { ConfigWatcher } from "@/components/providers/ConfigWatcher";
import { SetupRedirect } from "@/components/SetupRedirect";
import { DynamicTitle } from "@/components/DynamicTitle";
import { ThemeColorMeta } from "@/components/ThemeColorMeta";
import { FaviconLink } from "@/components/FaviconLink";
import { KeyboardInset } from "@/components/KeyboardInset";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import "@/styles/globals.css";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <Providers>
      <DynamicTitle titleKey="meta.title" />
      <ThemeColorMeta />
      <FaviconLink />
      <KeyboardInset />
      <RegisterServiceWorker />
      <AgreementCheckProvider>
        <ConfigWatcher />
        <SetupRedirect />
        <ConditionalSidebar />
        <MainContent>
          <Outlet />
        </MainContent>
        <Toaster />
      </AgreementCheckProvider>
    </Providers>
  );
}
