import { PasswordSettingsContent } from "./PasswordSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function PasswordSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsSecurityPassword" />
      <PasswordSettingsContent />
    </>
  );
}
