import { createFileRoute } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { AppInfoContent } from "@/components/about/AppInfoContent";

export const Route = createFileRoute("/settings/about/app/")({
  component: AppInfoSettingsPage,
});

function AppInfoSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAboutApp" />
      <AppInfoContent backHref="/settings/about" licensesHref="/settings/about/app/licenses" />
    </>
  );
}
