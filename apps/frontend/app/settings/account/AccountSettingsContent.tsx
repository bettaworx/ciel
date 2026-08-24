"use client";

import { useTranslations } from "next-intl";
import { Trash2, UserPen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRowGroup } from "@/components/settings/SettingsRow";
import { StepupRow } from "@/components/settings/StepupRow";

/**
 * Account settings: the identity of the account itself.
 *
 * Nothing here can be touched before re-authenticating, so both rows raise the
 * step-up prompt in place and only then navigate.
 */
export function AccountSettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref="/settings">
        {t("settings.account.title")}
      </PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <StepupRow
            icon={UserPen}
            label={t("settings.account.username.title")}
            href="/settings/account/username"
          />
          <StepupRow
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
