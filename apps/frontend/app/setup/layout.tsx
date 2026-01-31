import { ReactNode } from "react";
import { SetupLayoutProvider } from "@/components/setup/SetupLayoutContext";
import { SetupLayoutShell } from "@/components/setup/SetupLayoutShell";
import { RequireLoginRedirect } from "@/components/auth/RequireLoginRedirect";

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <SetupLayoutProvider>
      <RequireLoginRedirect>
        <SetupLayoutShell>{children}</SetupLayoutShell>
      </RequireLoginRedirect>
    </SetupLayoutProvider>
  );
}
