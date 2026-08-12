"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingItem } from "@/components/settings/SettingItem";
import { Switch } from "@/components/ui/switch";
import { useMe, useUpdatePrivacy } from "@/lib/hooks/use-queries";

export function AccountSettingsContent() {
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
            ? t("settings.account.privateAccount.enabled")
            : t("settings.account.privateAccount.disabled"),
        ),
      onError: () => toast.error(t("settings.account.privateAccount.error")),
    });
  };

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.account.title" />

      <SettingItem
        title={t("settings.account.privateAccount.title")}
        description={t("settings.account.privateAccount.description")}
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
    </div>
  );
}
