import { MfaSettingsContent } from "./MfaSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function MfaSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsSecurityMfa" />
      <MfaSettingsContent />
    </>
  );
}
