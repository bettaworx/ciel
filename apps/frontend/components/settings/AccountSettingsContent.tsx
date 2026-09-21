"use client";

import { useTranslations } from "@/lib/i18n";
import { Bot, Trash2, UserPen } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRowGroup, SettingsSwitchRow } from "@/components/settings/SettingsRow";
import { StepupRow } from "@/components/settings/StepupRow";
import { useMe, useUpdateBot } from "@/lib/hooks/use-queries";

/**
 * Account settings: the identity of the account itself.
 *
 * Two groups, split by what re-authentication buys. The first holds settings
 * that give an attacker nothing worth stealing — the bot label grants and hides
 * nothing. The second holds the rows that change or end the account, and none
 * of those can be touched before re-authenticating.
 */
export function AccountSettingsContent() {
  const t = useTranslations();
  const { data: me } = useMe();
  const updateBot = useUpdateBot();
  const isBot = me?.isBot ?? false;

  const handleBotChange = (next: boolean) => {
    updateBot.mutate(next, {
      onSuccess: () =>
        toast.success(
          next ? t("settings.account.bot.enabled") : t("settings.account.bot.disabled"),
        ),
      onError: () => toast.error(t("settings.account.bot.error")),
    });
  };

  return (
    <>
      <PageHeader backHref="/settings">{t("settings.account.title")}</PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <SettingsSwitchRow
            icon={Bot}
            label={t("settings.account.bot.title")}
            checked={isBot}
            onCheckedChange={handleBotChange}
            disabled={!me || updateBot.isPending}
          />
        </SettingsRowGroup>
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
