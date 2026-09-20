import { createFileRoute } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { LicensesContent } from "@/components/about/LicensesContent";

export const Route = createFileRoute("/settings/about/app/licenses")({
  component: LicensesSettingsPage,
});

function LicensesSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAboutLicenses" />
      <LicensesContent backHref="/settings/about/app" />
    </>
  );
}
