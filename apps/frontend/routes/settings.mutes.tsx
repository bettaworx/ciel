import { createFileRoute } from "@tanstack/react-router";
import { MutesSettingsContent } from "@/components/settings/MutesSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/mutes")({
  component: MutesSettingsPage,
});

function MutesSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsMutes" />
      <MutesSettingsContent />
    </>
  );
}
