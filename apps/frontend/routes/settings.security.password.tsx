import { createFileRoute } from "@tanstack/react-router";
import { PasswordSettingsContent } from "@/components/settings/PasswordSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/security/password")({
  component: PasswordSettingsPage,
});

function PasswordSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsSecurityPassword" />
      <PasswordSettingsContent />
    </>
  );
}
