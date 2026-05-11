"use client";

import { useTranslations } from "next-intl";
import { useServerInfo, useAdminSettings } from "@/lib/hooks/use-queries";
import { ServerProfileSection } from "@/components/admin/config/ServerProfileSection";
import { SignupSettingsSection } from "@/components/admin/config/SignupSettingsSection";
import { Spinner } from "@/components/ui/spinner";

export default function AdminConfigPage() {
  const t = useTranslations("admin.config");
  
  const { data: serverInfo, isLoading: loadingInfo } = useServerInfo();
  const { data: settings, isLoading: loadingSettings } = useAdminSettings();

  if (loadingInfo || loadingSettings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="sm" className="text-muted-foreground" />
      </div>
    );
  }

  if (!serverInfo || !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">{t("error") || "Failed to load settings"}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-12">
        {/* Server Profile Section */}
        <ServerProfileSection serverInfo={serverInfo} />

        {/* Divider */}
        <hr className="border-border" />

        {/* Signup Settings Section */}
        <SignupSettingsSection settings={settings} />
      </div>
    </div>
  );
}
