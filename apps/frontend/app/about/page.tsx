"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { DynamicTitle } from "@/components/DynamicTitle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useServerInfo } from "@/lib/hooks/use-queries";

export default function AboutPage() {
  const t = useTranslations("about");
  const { data: serverInfo } = useServerInfo();

  return (
    <PageContainer
      maxWidth="2xl"
      header={<PageHeader>{t("title")}</PageHeader>}
    >
      <DynamicTitle title={t("title")} />
      <div className="flex flex-col gap-3">
        {/* Card: server icon + name */}
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

        <Separator />

        {/* Navigation panel */}
        <div className="bg-card rounded-2xl flex flex-col overflow-hidden">
          <Button variant="list_row" size="list" asChild>
            <Link href="/version">
              <span>{t("versionInfo")}</span>
              <ChevronRight />
            </Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
