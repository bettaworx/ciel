"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useServerInfo } from "@/lib/hooks/use-queries";

type DynamicTitleProps = {
  title?: string;
  titleKey?: string;
};

/**
 * DynamicTitle - ページタイトルを動的にサーバー名で更新するコンポーネント
 * Dynamically updates the page title with the server name
 */
export function DynamicTitle({ title, titleKey }: DynamicTitleProps) {
  const { data: serverInfo } = useServerInfo();
  const pathname = usePathname();
  const t = useTranslations();

  useEffect(() => {
    const serverName = serverInfo?.serverName;
    if (!serverName) return;

    const resolvedTitle = titleKey
      ? t(titleKey, { serverName })
      : title;
    if (!resolvedTitle) return;

    document.title = `${resolvedTitle} / ${serverName}`;
  }, [serverInfo, pathname, t, title, titleKey]);

  return null;
}
