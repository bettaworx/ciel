import { DynamicTitle } from "@/components/DynamicTitle";
import { AppInfoContent } from "@/components/about/AppInfoContent";

export default function AppInfoSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAboutApp" />
      <AppInfoContent
        backHref="/settings/about"
        licensesHref="/settings/about/app/licenses"
      />
    </>
  );
}
