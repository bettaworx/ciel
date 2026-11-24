import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsContent } from "@/components/settings/SecuritySettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/security/")({
  component: SecuritySettingsPage,
});

function SecuritySettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsSecurity" />
      <SecuritySettingsContent />
    </>
  );
}
