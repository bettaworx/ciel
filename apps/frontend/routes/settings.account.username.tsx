import { createFileRoute } from "@tanstack/react-router";
import { UsernameSettingsContent } from "@/components/settings/UsernameSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/account/username")({
  component: UsernameSettingsPage,
});

function UsernameSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccountUsername" />
      <UsernameSettingsContent />
    </>
  );
}
