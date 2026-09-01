"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
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

/**
 * Build metadata for both halves of the deployment. Shared by the public
 * /version page and the settings category; the licenses link differs between
 * them so each keeps the visitor inside its own shell.
 */
export function AppInfoContent({
  backHref,
  licensesHref,
}: {
  backHref?: string;
  licensesHref: string;
}) {
  const t = useTranslations("about");
  const { data: serverInfo } = useServerInfo();

  const appVersion = process.env.NEXT_PUBLIC_BUILD_VERSION ?? "—";
  const appCommit = process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "—";
  const appBranch = process.env.NEXT_PUBLIC_BUILD_BRANCH ?? "—";

  return (
    <>
      <PageHeader backHref={backHref}>{t("versionInfo")}</PageHeader>
      <div className="flex flex-col gap-3">
        {/* Card 1: logo + name + version */}
        <div className="bg-card rounded-2xl p-8 flex flex-col items-center">
          <div className="mb-6">
            <div className="w-32 h-32 bg-muted rounded-2xl" />
          </div>

          <h1 className="text-2xl font-bold text-center">ciel</h1>
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
        <div className="bg-card rounded-2xl flex flex-col overflow-hidden">
          <Button variant="list_row" size="list" asChild>
            <Link href={licensesHref}>
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
      </div>
    </>
  );
}
