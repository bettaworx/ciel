"use client";

import { useTranslations } from "next-intl";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRowGroup } from "@/components/settings/SettingsRow";
import { StepupRow } from "@/components/settings/StepupRow";

/**
 * Security settings. Nothing here can be touched before re-authenticating, so
 * both rows raise the step-up prompt in place and only then navigate.
 */
export function SecuritySettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref="/settings">
        {t("settings.security.title")}
      </PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <StepupRow
            icon={KeyRound}
            label={t("settings.security.password.title")}
            href="/settings/security/password"
          />
          <StepupRow
            icon={ShieldCheck}
            label={t("settings.security.mfa.title")}
            href="/settings/security/mfa"
          />
        </SettingsRowGroup>
      </div>
    </>
  );
}
