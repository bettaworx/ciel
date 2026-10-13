import { createFileRoute, Outlet } from "@tanstack/react-router";
import { usePathname } from "@/lib/navigation";
import { isConcentratedMode } from "@/lib/utils/concentrated-mode";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageContainer } from "@/components/PageContainer";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  const pathname = usePathname();

  // Step-up wizards own the whole screen: they bring their own full-screen
  // shell, so the page container would only box them in.
  if (isConcentratedMode(pathname)) {
    return (
      <RequireAuth redirectOnClose="/">
        <Outlet />
      </RequireAuth>
    );
  }

  return (
    <RequireAuth redirectOnClose="/">
      {/* pt-0: every settings page leads with a PageHeader, which brings its
          own top inset — the same deal PageContainer's `header` prop makes. */}
      <PageContainer padding="compact" as="div" className="pt-0">
        {/* One layout at every width: settings is a stack of lists you drill
            into, so a desktop gets the same index → category → detail path a
            phone does, just centred and capped at a readable width. */}
        <main className="mx-auto w-full max-w-2xl">
          <Outlet />
        </main>
      </PageContainer>
    </RequireAuth>
  );
}
