import { ReactNode } from "react";
import { SetupLayoutProvider } from "@/components/setup/SetupLayoutContext";
import { SetupLayoutShell } from "@/components/setup/SetupLayoutShell";

/**
 * Layout for admin setup wizard
 * Unlike user setup, this does NOT require login redirect since
 * the admin account doesn't exist yet during initial setup
 */
export default function AdminSetupLayout({ children }: { children: ReactNode }) {
  return (
    <SetupLayoutProvider>
      <SetupLayoutShell>{children}</SetupLayoutShell>
    </SetupLayoutProvider>
  );
}
