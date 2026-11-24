import { createFileRoute } from "@tanstack/react-router";
import { AdminSetupWizard } from "@/components/admin-setup/AdminSetupWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/server-setup/")({
  component: AdminSetupPage,
});

function AdminSetupPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.adminSetup" />
      <AdminSetupWizard />
    </>
  );
}
