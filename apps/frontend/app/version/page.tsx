"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/PageContainer";
import { DynamicTitle } from "@/components/DynamicTitle";
import { AppInfoContent } from "@/components/about/AppInfoContent";

export default function VersionPage() {
  const t = useTranslations("about");

  return (
    // pt-0: AppInfoContent leads with a PageHeader, which brings its own top
    // inset — the same deal PageContainer's `header` prop makes.
    <PageContainer maxWidth="2xl" className="pt-0">
      <DynamicTitle title={t("versionInfo")} />
      <AppInfoContent licensesHref="/version/licenses" />
    </PageContainer>
  );
}
