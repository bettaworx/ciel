import { SettingsIndexContent } from "./SettingsIndexContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function SettingsIndexPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settings" />
      <SettingsIndexContent />
    </>
  );
}
