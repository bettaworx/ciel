"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPageHeaderProps {
  /**
   * 翻訳キー（例: "settings.general.title"）
   */
  currentPageKey: string;
}

export function SettingsPageHeader({
  currentPageKey,
}: SettingsPageHeaderProps) {
  const t = useTranslations();
  const tSettings = useTranslations("settings");
  const router = useRouter();

  const pageTitle = t(currentPageKey);

  const handleBack = () => {
    router.push("/settings");
  };

  return (
    <div className="mt-3 mb-6 md:mt-6">
      <div className="flex items-center gap-2">
        {/* Mobile only: Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="shrink-0 md:hidden"
          aria-label={tSettings("backToSettings")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
      </div>
    </div>
  );
}
