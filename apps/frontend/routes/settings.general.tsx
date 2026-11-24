import { createFileRoute } from "@tanstack/react-router";
import { GeneralSettingsContent } from "@/components/settings/GeneralSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/general")({
  component: GeneralSettingsPage,
});

function GeneralSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsGeneral" />
      <GeneralSettingsContent />
    </>
  );
}
