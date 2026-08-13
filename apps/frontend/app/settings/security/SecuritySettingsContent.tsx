"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, KeyRound } from "lucide-react";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { Button } from "@/components/ui/button";

export function SecuritySettingsContent() {
  const t = useTranslations();

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.security.title" />

      {/* A row that navigates rather than changes a value, so it uses the same
          list_row treatment as the mutes link and the licenses page. */}
      <div className="flex flex-col overflow-hidden rounded-2xl bg-card">
        <Button variant="list_row" size="list" asChild>
          <Link href="/settings/security/password">
            <span className="flex items-center gap-3">
              <KeyRound />
              <span>{t("settings.security.password.title")}</span>
            </span>
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
