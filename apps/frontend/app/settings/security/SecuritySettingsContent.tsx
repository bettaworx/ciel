"use client";

import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRow, SettingsRowGroup } from "@/components/settings/SettingsRow";

export function SecuritySettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader>{t("settings.security.title")}</PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <SettingsRow
            icon={KeyRound}
            label={t("settings.security.password.title")}
            href="/settings/security/password"
          />
        </SettingsRowGroup>
      </div>
    </>
  );
}
