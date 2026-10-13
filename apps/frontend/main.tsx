import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initRuntimeConfig } from "@/lib/api/base-url";
import { LoadingScreen } from "@/components/LoadingScreen";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({
  routeTree,
  // Preload on hover/focus, which is what next/link's prefetch did for us.
  defaultPreload: "intent",
  // Route modules are code-split, so a cold navigation shows this briefly.
  defaultPendingComponent: () => <LoadingScreen isLoading={true} />,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("#root is missing from index.html");
}

// The API base URL comes from the deployment, not the build, so it has to be
// loaded before anything can call the API. Awaiting it here keeps every
// downstream resolveApiBaseUrl() call synchronous.
await initRuntimeConfig();

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
