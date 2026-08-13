import { MutesSettingsContent } from "./MutesSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function MutesSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsMutes" />
      <MutesSettingsContent />
    </>
  );
}
