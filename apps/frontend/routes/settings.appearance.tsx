import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettingsContent } from "@/components/settings/AppearanceSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/appearance")({
  component: AppearanceSettingsPage,
});

function AppearanceSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAppearance" />
      <AppearanceSettingsContent />
    </>
  );
}
