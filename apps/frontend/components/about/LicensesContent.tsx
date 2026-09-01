"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type LicenseEntry = {
  name: string;
  version: string;
  license: string;
  repository: string | null;
  licenseUrl: string | null;
  licenseText: string | null;
  source?: string;
  font?: {
    weights?: string[];
    styles?: string[];
    subsets?: string[];
    display?: string;
    preload?: boolean;
  };
};

/**
 * Third-party licenses, read from the build-time /licenses.json. Shared by the
 * public /version/licenses page and the settings category.
 */
export function LicensesContent({ backHref }: { backHref?: string }) {
  const t = useTranslations("about.licenses");
  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);

  useEffect(() => {
    fetch("/licenses.json")
      .then((res) => res.json())
      .then((data: LicenseEntry[]) => setLicenses(data))
      .catch(() => setLicenses([]));
  }, []);

  return (
    <>
      <PageHeader backHref={backHref}>{t("title")}</PageHeader>
      <div className="bg-card rounded-2xl flex flex-col overflow-hidden">
        {licenses.map((entry, index) => {
          const key = `${entry.name}@${entry.version}`;
          const linkTarget = entry.licenseUrl ?? entry.repository;
          const details = [
            entry.version,
            entry.license,
            entry.source,
            entry.font?.weights?.length
              ? `weights: ${entry.font.weights.join(", ")}`
              : null,
          ].filter(Boolean);
          const label = (
            <>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-sm font-medium truncate">{entry.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {details.join(" · ")}
                </span>
              </div>
              {linkTarget && <ExternalLink className="opacity-60 shrink-0" />}
            </>
          );

          const row = linkTarget ? (
            <Button variant="list_row" size="list" asChild>
              <a href={linkTarget} target="_blank" rel="noopener noreferrer">
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
    </>
  );
}
