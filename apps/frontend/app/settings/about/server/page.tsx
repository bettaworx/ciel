import { DynamicTitle } from "@/components/DynamicTitle";
import { ServerInfoContent } from "@/components/about/ServerInfoContent";

export default function ServerInfoSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAboutServer" />
      <ServerInfoContent backHref="/settings/about" />
    </>
  );
}
