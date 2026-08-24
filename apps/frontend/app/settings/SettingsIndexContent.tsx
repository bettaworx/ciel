"use client";

import { useTranslations } from "next-intl";
import { settingsCategories } from "@/lib/settings-categories";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountCard } from "@/components/settings/AccountCard";
import { SettingsRow, SettingsRowGroup } from "@/components/settings/SettingsRow";

export function SettingsIndexContent() {
  const t = useTranslations();

  return (
    <>
      {/* Reached from the nav, so there is nothing to go back to. */}
      <PageHeader showBackButton={false}>{t("settings.title")}</PageHeader>

      <AccountCard />

      <SettingsRowGroup>
        {settingsCategories.map((category) => (
          <SettingsRow
            key={category.id}
            icon={category.icon}
            label={t(category.labelKey)}
            href={category.href}
          />
        ))}
      </SettingsRowGroup>
    </>
  );
}
