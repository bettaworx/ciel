import { createFileRoute } from "@tanstack/react-router";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/setup/")({
  component: SetupPage,
});

function SetupPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.setup" />
      <SetupWizard />
    </>
  );
}
