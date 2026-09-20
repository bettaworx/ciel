import { createFileRoute } from "@tanstack/react-router";
import { AboutSettingsContent } from "@/components/settings/AboutSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/about/")({
  component: AboutSettingsPage,
});

function AboutSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAbout" />
      <AboutSettingsContent />
    </>
  );
}
