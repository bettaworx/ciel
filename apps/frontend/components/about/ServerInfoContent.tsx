"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { useServerInfo } from "@/lib/hooks/use-queries";

/**
 * Server identity: icon and name. Shared by the public /about page and the
 * settings category, so both stay in step.
 */
export function ServerInfoContent({ backHref }: { backHref?: string }) {
  const t = useTranslations("about");
  const { data: serverInfo } = useServerInfo();

  return (
    <>
      <PageHeader backHref={backHref}>{t("title")}</PageHeader>
      <div className="bg-card rounded-2xl p-8 flex flex-col items-center">
        <div className="mb-6">
          {serverInfo?.serverIconUrl ? (
            <Image
              src={serverInfo.serverIconUrl}
              alt="Server icon"
              width={128}
              height={128}
              unoptimized
              className="rounded-2xl object-cover"
            />
          ) : (
            <div className="w-32 h-32 bg-primary rounded-2xl" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-center">
          {serverInfo?.serverName ?? "Ciel"}
        </h1>
      </div>
    </>
  );
}
