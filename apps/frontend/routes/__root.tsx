import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
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

/**
 * Router devtools, development only.
 *
 * Imported lazily behind an `import.meta.env.DEV` check so the package is
 * tree-shaken out of the production bundle rather than shipped and hidden.
 */
const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      })),
    )
  : () => null;

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
      <Suspense>
        <RouterDevtools position="bottom-right" />
      </Suspense>
    </Providers>
  );
}
