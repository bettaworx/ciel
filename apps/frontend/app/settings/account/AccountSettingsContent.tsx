"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { ToggleRow } from "@/components/settings/NestedToggle";
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

      <ToggleRow
        icon={Lock}
        title={t("settings.account.privateAccount.title")}
        description={t("settings.account.privateAccount.description")}
        checked={isPrivate}
        onCheckedChange={handleChange}
        disabled={!me || updatePrivacy.isPending}
      />
    </div>
  );
}
