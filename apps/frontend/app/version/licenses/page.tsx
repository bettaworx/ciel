"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/PageContainer";
import { DynamicTitle } from "@/components/DynamicTitle";
import { LicensesContent } from "@/components/about/LicensesContent";

export default function LicensesPage() {
  const t = useTranslations("about.licenses");

  return (
    // pt-0: LicensesContent leads with a PageHeader, which brings its own top
    // inset — the same deal PageContainer's `header` prop makes.
    <PageContainer maxWidth="2xl" className="pt-0">
      <DynamicTitle title={t("title")} />
      <LicensesContent />
    </PageContainer>
  );
}
