"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/PageContainer";
import { DynamicTitle } from "@/components/DynamicTitle";
import { ServerInfoContent } from "@/components/about/ServerInfoContent";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    // pt-0: ServerInfoContent leads with a PageHeader, which brings its own
    // top inset — the same deal PageContainer's `header` prop makes.
    <PageContainer maxWidth="2xl" className="pt-0">
      <DynamicTitle title={t("title")} />
      <div className="flex flex-col gap-3">
        <ServerInfoContent />

        <Separator />

        {/* Navigation panel. Settings has its own category index for this, so
            it lives here rather than in the shared component. */}
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
