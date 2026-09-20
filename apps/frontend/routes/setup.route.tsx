import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SetupLayoutProvider } from "@/components/setup/SetupLayoutContext";
import { SetupLayoutShell } from "@/components/setup/SetupLayoutShell";
import { RequireLoginRedirect } from "@/components/auth/RequireLoginRedirect";

export const Route = createFileRoute("/setup")({
  component: SetupLayout,
});

function SetupLayout() {
  return (
    <SetupLayoutProvider>
      <RequireLoginRedirect>
        <SetupLayoutShell>
          <Outlet />
        </SetupLayoutShell>
      </RequireLoginRedirect>
    </SetupLayoutProvider>
  );
}
