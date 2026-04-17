"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { DynamicTitle } from "@/components/DynamicTitle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useServerInfo } from "@/lib/hooks/use-queries";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  );
}

export default function VersionPage() {
  const t = useTranslations("about");
  const { data: serverInfo } = useServerInfo();

  const appVersion = process.env.NEXT_PUBLIC_BUILD_VERSION ?? "—";
  const appCommit = process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "—";
  const appBranch = process.env.NEXT_PUBLIC_BUILD_BRANCH ?? "—";

  return (
    <PageContainer
      maxWidth="2xl"
      header={<PageHeader>{t("title")}</PageHeader>}
      className="flex flex-col gap-3"
    >
      <DynamicTitle title={t("title")} />
      {/* Card 1: logo + name + version */}
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
        <p className="text-sm text-muted-foreground mt-1">
          {serverInfo?.version ?? "—"}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="server">
        <TabsList className="w-full">
          <TabsTrigger value="server">{t("tabs.server")}</TabsTrigger>
          <TabsTrigger value="app">{t("tabs.frontend")}</TabsTrigger>
        </TabsList>

        {/* Server tab */}
        <TabsContent value="server">
          <div className="bg-card rounded-2xl px-4 mt-3">
            <InfoRow label={t("version")} value={serverInfo?.version ?? "—"} />
            <Separator />
            <InfoRow label={t("commit")} value={serverInfo?.commit ?? "—"} />
            <Separator />
            <InfoRow label={t("branch")} value={serverInfo?.branch ?? "—"} />
          </div>
        </TabsContent>

        {/* App tab */}
        <TabsContent value="app">
          <div className="bg-card rounded-2xl px-4 mt-3">
            <InfoRow label={t("appVersion")} value={appVersion} />
            <Separator />
            <InfoRow label={t("appCommit")} value={appCommit} />
            <Separator />
            <InfoRow label={t("appBranch")} value={appBranch} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Divider */}
      <Separator />

      {/* Merged panel: licenses + source code */}
      <div className="bg-card rounded-2xl p-1 flex flex-col gap-1">
        <Button variant="list_row" size="list" asChild>
          <Link href="/version/licenses">
            <span>{t("licenses.linkLabel")}</span>
            <ChevronRight />
          </Link>
        </Button>
        <Separator />
        <Button variant="list_row" size="list" asChild>
          <a
            href="https://github.com/bettaworx/ciel"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{t("sourceCode")}</span>
            <ExternalLink className="opacity-60" />
          </a>
        </Button>
      </div>
    </PageContainer>
  );
}
