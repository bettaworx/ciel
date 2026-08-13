import { PasswordWizard } from "./PasswordWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function PasswordSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsSecurityPassword" />
      <PasswordWizard />
    </>
  );
}
