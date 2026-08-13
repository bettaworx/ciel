"use client";

import { useTranslations } from "next-intl";
import { Trash2, UserPen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRow, SettingsRowGroup } from "@/components/settings/SettingsRow";

/**
 * Account settings: the identity of the account itself.
 *
 * Both rows navigate to a step-up wizard rather than editing in place — nothing
 * here can be touched before re-authenticating.
 */
export function AccountSettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader>{t("settings.account.title")}</PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <SettingsRow
            icon={UserPen}
            label={t("settings.account.username.title")}
            href="/settings/account/username"
          />
          <SettingsRow
            icon={Trash2}
            label={t("settings.account.delete.title")}
            href="/settings/account/delete"
            className="text-destructive"
          />
        </SettingsRowGroup>
      </div>
    </>
  );
}
