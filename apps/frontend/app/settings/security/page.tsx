import { SecuritySettingsContent } from "./SecuritySettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function SecuritySettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsSecurity" />
      <SecuritySettingsContent />
    </>
  );
}
