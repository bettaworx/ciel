import { AboutSettingsContent } from "./AboutSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function AboutSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAbout" />
      <AboutSettingsContent />
    </>
  );
}
