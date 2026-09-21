import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SetupLayoutProvider } from "@/components/setup/SetupLayoutContext";
import { SetupLayoutShell } from "@/components/setup/SetupLayoutShell";

export const Route = createFileRoute("/server-setup")({
  component: AdminSetupLayout,
});

/**
 * Layout for admin setup wizard
 * Unlike user setup, this does NOT require login redirect since
 * the admin account doesn't exist yet during initial setup
 */
function AdminSetupLayout() {
  return (
    <SetupLayoutProvider>
      <SetupLayoutShell>
        <Outlet />
      </SetupLayoutShell>
    </SetupLayoutProvider>
  );
}
