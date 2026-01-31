"use client";

import { useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";

export function CompleteStep() {
  const t = useTranslations();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Success message with icon - centered */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-9">
        <div className="flex justify-center">
          <CircleCheck className="w-16 h-16 text-c-1" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">{t("setup.completed.title")}</h2>
          <p className="text-muted-foreground">{t("setup.completed.description")}</p>
        </div>
      </div>

    </div>
  );
}
