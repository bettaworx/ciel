import { GeneralSettingsContent } from "./GeneralSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function GeneralSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsGeneral" />
      <GeneralSettingsContent />
    </>
  );
}
