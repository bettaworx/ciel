import { createFileRoute } from "@tanstack/react-router";
import { MfaSettingsContent } from "@/components/settings/MfaSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/security/mfa")({
  component: MfaSettingsPage,
});

function MfaSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsSecurityMfa" />
      <MfaSettingsContent />
    </>
  );
}
