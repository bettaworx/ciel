"use client";

import { useTranslations } from "next-intl";

export function WelcomeStep() {
  const t = useTranslations("adminSetup");

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
        <h2 className="text-2xl font-bold">{t("welcome.title")}</h2>
        <p className="text-muted-foreground max-w-md">
          {t("welcome.description")}
        </p>
      </div>
    </div>
  );
}
