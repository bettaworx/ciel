"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SettingItem } from "@/components/settings/SettingItem";
import { useUpdateSignupSettings } from "@/lib/hooks/use-queries";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { components } from "@/lib/api/api";

interface SignupSettingsSectionProps {
  settings: components["schemas"]["ServerSettings"];
}

export function SignupSettingsSection({ settings }: SignupSettingsSectionProps) {
  const t = useTranslations("admin.config.signup");
  const router = useRouter();
  const [signupEnabled, setSignupEnabled] = useState(settings.signupEnabled);
  const updateMutation = useUpdateSignupSettings();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(signupEnabled);
      toast.success(t("updateSuccess"));
    } catch (error) {
      console.error("Failed to update signup settings:", error);
      toast.error(t("updateError"));
    }
  };

  const hasChanges = signupEnabled !== settings.signupEnabled;
  const isInviteOnlyEnabled = !signupEnabled;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("title")}</h2>
      </div>

      <div className="space-y-4">
        {/* Invite-Only Toggle */}
        <SettingItem
          title={t("inviteOnlyLabel")}
          description={t("inviteOnlyDescription")}
          align="center"
        >
          <Switch
            checked={isInviteOnlyEnabled}
            onCheckedChange={(checked) => setSignupEnabled(!checked)}
          />
        </SettingItem>

        {/* Alert when invite-only is enabled */}
        {isInviteOnlyEnabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("inviteRequiredTitle")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{t("inviteRequiredDescription")}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/invite")}
                className="w-fit"
              >
                {t("createInviteCode")}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Status Display */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("currentStatus")}</p>
              <p className="text-sm text-muted-foreground">
                {signupEnabled ? t("statusOpen") : t("statusInviteOnly")}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
