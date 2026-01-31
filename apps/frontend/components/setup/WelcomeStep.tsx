"use client";

import { useTranslations } from "next-intl";
import { useServerInfo } from "@/lib/hooks/use-queries";

export function WelcomeStep() {
  const t = useTranslations();
  const { data: serverInfo } = useServerInfo();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("setup.welcome.title")}</h2>
        <p className="text-muted-foreground">
          {t("setup.welcome.description", {
            serverName: serverInfo?.serverName || "Ciel",
          })}
        </p>
      </div>
    </div>
  );
}
