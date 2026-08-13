import { AccountSettingsContent } from "./AccountSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function AccountSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccount" />
      <AccountSettingsContent />
    </>
  );
}
