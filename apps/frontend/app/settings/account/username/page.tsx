import { UsernameSettingsContent } from "./UsernameSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function UsernameSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccountUsername" />
      <UsernameSettingsContent />
    </>
  );
}
