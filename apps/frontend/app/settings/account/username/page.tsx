import { UsernameWizard } from "./UsernameWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function UsernameSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccountUsername" />
      <UsernameWizard />
    </>
  );
}
