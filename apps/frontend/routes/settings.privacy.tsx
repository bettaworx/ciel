import { createFileRoute } from "@tanstack/react-router";
import { PrivacySettingsContent } from "@/components/settings/PrivacySettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/privacy")({
  component: PrivacySettingsPage,
});

function PrivacySettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsPrivacy" />
      <PrivacySettingsContent />
    </>
  );
}
