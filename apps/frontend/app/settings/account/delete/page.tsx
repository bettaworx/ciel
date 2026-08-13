import { DeleteAccountWizard } from "./DeleteAccountWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function DeleteAccountPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccountDelete" />
      <DeleteAccountWizard />
    </>
  );
}
