"use client";

import { useTranslations } from "next-intl";
import { Info, Server } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRow, SettingsRowGroup } from "@/components/settings/SettingsRow";

export function AboutSettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref="/settings" showBackButton="mobile">
        {t("settings.about.title")}
      </PageHeader>
      <SettingsRowGroup>
        <SettingsRow
          icon={Server}
          label={t("settings.about.server")}
          href="/settings/about/server"
        />
        <SettingsRow
          icon={Info}
          label={t("settings.about.app")}
          href="/settings/about/app"
        />
      </SettingsRowGroup>
    </>
  );
}
