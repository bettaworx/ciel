import { AppearanceSettingsContent } from "./AppearanceSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function AppearanceSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAppearance" />
      <AppearanceSettingsContent />
    </>
  );
}
