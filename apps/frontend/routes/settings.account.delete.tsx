import { createFileRoute } from "@tanstack/react-router";
import { DeleteAccountContent } from "@/components/settings/DeleteAccountContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/settings/account/delete")({
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccountDelete" />
      <DeleteAccountContent />
    </>
  );
}
