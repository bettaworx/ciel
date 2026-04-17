"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { DynamicTitle } from "@/components/DynamicTitle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type LicenseEntry = {
  name: string;
  version: string;
  license: string;
  repository: string | null;
  licenseText: string | null;
};

export default function LicensesPage() {
  const t = useTranslations("about.licenses");
  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);

  useEffect(() => {
    fetch("/licenses.json")
      .then((res) => res.json())
      .then((data: LicenseEntry[]) => setLicenses(data))
      .catch(() => setLicenses([]));
  }, []);

  return (
    <PageContainer
      maxWidth="2xl"
      header={<PageHeader>{t("title")}</PageHeader>}
    >
      <DynamicTitle title={t("title")} />
      <div className="bg-card rounded-2xl flex flex-col overflow-hidden">
        {licenses.map((entry, index) => {
          const key = `${entry.name}@${entry.version}`;
          const label = (
            <>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-sm font-medium truncate">{entry.name}</span>
                <span className="text-xs text-muted-foreground truncate">{entry.version}</span>
              </div>
              {entry.repository && <ExternalLink className="opacity-60 shrink-0" />}
            </>
          );

          const row = entry.repository ? (
            <Button variant="list_row" size="list" asChild>
              <a href={entry.repository} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </Button>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 rounded-md">
              {label}
            </div>
          );

          return (
            <React.Fragment key={key}>
              {index > 0 && <Separator />}
              {row}
            </React.Fragment>
          );
        })}
      </div>
    </PageContainer>
  );
}
