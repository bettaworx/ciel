"use client";

import { useTranslations } from "next-intl";
import { Moon } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Offline page displayed when the server is unreachable.
 *
 * Features:
 * - Displays a message indicating the server is offline
 * - Provides a manual reload button to retry connection
 */
export default function OfflinePage() {
  const t = useTranslations("offline");

  const handleReload = () => {
    window.location.href = "/";
  };

  return (
    <PageContainer className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-12">
            <Moon className="h-32 w-32 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription className="text-base mt-3">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleReload} variant="primary" size="lg">
            {t("reload")}
          </Button>
        </CardContent>
      </div>
    </PageContainer>
  );
}
