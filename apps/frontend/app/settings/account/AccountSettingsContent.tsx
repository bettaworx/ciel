"use client";

import { useTranslations } from "next-intl";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";

export function AccountSettingsContent() {
  const t = useTranslations();

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.account.title" />
    </div>
  );
}
