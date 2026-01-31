"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { settingsCategories } from "@/lib/settings-categories";
import { Separator } from "@/components/ui/separator";

export function SettingsIndexContent() {
  const t = useTranslations();
  const router = useRouter();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (
      !hasCheckedRef.current &&
      typeof window !== "undefined" &&
      window.innerWidth >= 768
    ) {
      hasCheckedRef.current = true;
      router.replace("/settings/general");
    }
  }, [router]);

  // 翻訳を適用
  const categories = settingsCategories.map((cat) => ({
    ...cat,
    label: t(cat.labelKey),
  }));

  // モバイル: カテゴリ一覧を表示
  // デスクトップ: useEffectでリダイレクトされるが、一瞬表示される可能性があるのでmd:hiddenで隠す
  return (
    <div className="md:hidden">
      <h1 className="text-2xl font-bold ml-3 mt-3 mb-6">
        {t("settings.title")}
      </h1>
      <div className="bg-card rounded-xl">
        {categories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={category.id}>
              <Link href={category.href}>
                <div className="flex items-center justify-between p-4 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
              {index < categories.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
