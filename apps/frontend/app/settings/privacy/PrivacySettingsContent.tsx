"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Lock, UserX } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  SettingsRow,
  SettingsRowGroup,
  SettingsSwitchRow,
} from "@/components/settings/SettingsRow";
import { useMe, useUpdatePrivacy } from "@/lib/hooks/use-queries";

/**
 * Privacy settings: who can see this account, and which users it hides.
 *
 * The muted and blocked lists live on their own page rather than inline: they
 * are paginated and can run long, which a settings row is the wrong shape for.
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
    <>
      <PageHeader backHref="/settings">
        {t("settings.privacy.title")}
      </PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup title={t("settings.privacy.sections.visibility")}>
          <SettingsSwitchRow
            icon={Lock}
            label={t("settings.privacy.privateAccount.title")}
            checked={isPrivate}
            onCheckedChange={handleChange}
            disabled={!me || updatePrivacy.isPending}
          />
        </SettingsRowGroup>

        <SettingsRowGroup title={t("settings.privacy.sections.moderation")}>
          <SettingsRow
            icon={UserX}
            label={t("settings.privacy.hiddenAccounts.title")}
            href="/settings/mutes"
          />
        </SettingsRowGroup>
      </div>
    </>
  );
}
