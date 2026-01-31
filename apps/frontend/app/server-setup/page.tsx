import { AdminSetupWizard } from "@/components/admin-setup/AdminSetupWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function AdminSetupPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.adminSetup" />
      <AdminSetupWizard />
    </>
  );
}
