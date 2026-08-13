"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Trash2, UserPen } from "lucide-react";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

/**
 * Account settings: the identity of the account itself.
 *
 * Both rows navigate to a step-up wizard rather than editing in place — nothing
 * here can be touched before re-authenticating — so they use the same list_row
 * treatment as the mutes link and the licenses page.
 */
export function AccountSettingsContent() {
  const t = useTranslations();

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.account.title" />

      <div className="flex flex-col overflow-hidden rounded-2xl bg-card">
        <Button variant="list_row" size="list" asChild>
          <Link href="/settings/account/username">
            <span className="flex items-center gap-3">
              <UserPen />
              <span>{t("settings.account.username.title")}</span>
            </span>
            <ChevronRight />
          </Link>
        </Button>

        <Separator />

        {/* The colour has to ride on the Button so tailwind-merge drops
            list_row's text-foreground; on the Link both would survive. */}
        <Button variant="list_row" size="list" asChild className="text-destructive">
          <Link href="/settings/account/delete">
            <span className="flex items-center gap-3">
              <Trash2 />
              <span>{t("settings.account.delete.title")}</span>
            </span>
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
