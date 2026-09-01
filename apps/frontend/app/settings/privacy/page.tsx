import { PrivacySettingsContent } from "./PrivacySettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function PrivacySettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsPrivacy" />
      <PrivacySettingsContent />
    </>
  );
}
