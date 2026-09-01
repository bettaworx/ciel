import { DynamicTitle } from "@/components/DynamicTitle";
import { LicensesContent } from "@/components/about/LicensesContent";

export default function LicensesSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAboutLicenses" />
      <LicensesContent backHref="/settings/about/app" />
    </>
  );
}
