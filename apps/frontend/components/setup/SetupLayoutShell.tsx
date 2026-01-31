"use client";

import { SetupProgress } from "@/components/setup/SetupProgress";
import { useSetupLayout } from "@/components/setup/SetupLayoutContext";
import { AuthLayoutShell } from "@/components/auth/AuthLayoutShell";

export function SetupLayoutShell({ children }: { children: React.ReactNode }) {
  const { progress, footer } = useSetupLayout();

  return (
    <AuthLayoutShell
      fixedAspectRatio={true}
      header={
        progress.visible ? (
          <SetupProgress
            currentStep={progress.currentStep}
            totalSteps={progress.totalSteps}
          />
        ) : null
      }
      footer={footer}
    >
      {children}
    </AuthLayoutShell>
  );
}
