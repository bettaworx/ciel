import { createFileRoute } from "@tanstack/react-router";
import { SettingsIndexContent } from "@/components/settings/SettingsIndexContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/")({
  component: SettingsIndexPage,
});

function SettingsIndexPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settings" />
      <SettingsIndexContent />
    </>
  );
}
