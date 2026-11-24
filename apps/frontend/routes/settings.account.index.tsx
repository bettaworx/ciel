import { createFileRoute } from "@tanstack/react-router";
import { AccountSettingsContent } from "@/components/settings/AccountSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/account/")({
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccount" />
      <AccountSettingsContent />
    </>
  );
}
