"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingItem } from "@/components/settings/SettingItem";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMe, useUpdatePrivacy } from "@/lib/hooks/use-queries";

/**
 * Privacy settings: who can see this account, and which users it hides.
 *
 * The muted and blocked lists live on their own page rather than inline: they
 * are paginated and can run long, which a settings card is the wrong shape for.
 * That row uses the same list_row button as the version page's licenses link,
 * since it navigates rather than changes a value.
 */
export function PrivacySettingsContent() {
  const t = useTranslations();
  const { data: me } = useMe();
  const updatePrivacy = useUpdatePrivacy();

  // Driven straight off the server's value rather than local state: the switch
  // controls who can see this account, so it must never show a state the server
  // has not actually applied.
  const isPrivate = me?.isPrivate ?? false;

  const handleChange = (next: boolean) => {
    updatePrivacy.mutate(next, {
      onSuccess: () =>
        toast.success(
          next
            ? t("settings.privacy.privateAccount.enabled")
            : t("settings.privacy.privateAccount.disabled"),
        ),
      onError: () => toast.error(t("settings.privacy.privateAccount.error")),
    });
  };

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.privacy.title" />

      <SettingItem
        title={t("settings.privacy.privateAccount.title")}
        description={t("settings.privacy.privateAccount.description")}
        align="center"
      >
        {/* SettingItem gives its control a fixed-width column, which a select
            fills but a switch does not. Push it to the far edge so the row reads
            across the whole card instead of stranding the switch mid-way. */}
        <div className="flex justify-end">
          <Switch
            checked={isPrivate}
            onCheckedChange={handleChange}
            disabled={!me || updatePrivacy.isPending}
          />
        </div>
      </SettingItem>

      <div className="flex flex-col overflow-hidden rounded-2xl bg-card">
        <Button variant="list_row" size="list" asChild>
          <Link href="/settings/mutes">
            <span>{t("settings.privacy.hiddenAccounts.title")}</span>
            <ChevronRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
