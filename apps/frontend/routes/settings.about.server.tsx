import { createFileRoute } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { ServerInfoContent } from "@/components/about/ServerInfoContent";

export const Route = createFileRoute("/settings/about/server")({
  component: ServerInfoSettingsPage,
});

function ServerInfoSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAboutServer" />
      <ServerInfoContent backHref="/settings/about" />
    </>
  );
}
