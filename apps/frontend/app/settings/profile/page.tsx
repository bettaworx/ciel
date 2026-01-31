import { ProfileSettingsContent } from "./ProfileSettingsContent";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function ProfileSettingsPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.settingsProfile" />
      <ProfileSettingsContent />
    </>
  );
}
