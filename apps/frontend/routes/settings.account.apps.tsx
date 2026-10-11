import { createFileRoute } from "@tanstack/react-router";
import { OAuthAppsContent } from "@/components/settings/OAuthAppsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/account/apps")({
  component: OAuthAppsPage,
});

function OAuthAppsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccountApps" />
      <OAuthAppsContent />
    </>
  );
}
