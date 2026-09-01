import { DeleteAccountContent } from "./DeleteAccountContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function DeleteAccountPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsAccountDelete" />
      <DeleteAccountContent />
    </>
  );
}
