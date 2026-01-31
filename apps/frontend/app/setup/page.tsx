import { SetupWizard } from "@/components/setup/SetupWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function SetupPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.setup" />
      <SetupWizard />
    </>
  );
}
