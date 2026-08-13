"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { settingsCategories } from "@/lib/settings-categories";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountCard } from "@/components/settings/AccountCard";
import { SettingsRow, SettingsRowGroup } from "@/components/settings/SettingsRow";

export function SettingsIndexContent() {
  const t = useTranslations();
  const router = useRouter();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (
      !hasCheckedRef.current &&
      typeof window !== "undefined" &&
      window.innerWidth >= 768
    ) {
      hasCheckedRef.current = true;
      router.replace("/settings/general");
    }
  }, [router]);

  // モバイル: カテゴリ一覧を表示
  // デスクトップ: useEffectでリダイレクトされるが、一瞬表示される可能性があるのでmd:hiddenで隠す
  return (
    <div className="md:hidden">
      {/* Reached from the nav, so there is nothing to go back to. */}
      <PageHeader showBackButton={false}>{t("settings.title")}</PageHeader>

      {/* The desktop sidebar carries this on every settings page; on mobile
          only the index has room for it. */}
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
    </div>
  );
}
