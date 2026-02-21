"use client";

import { useTranslations } from "next-intl";
import { Moon, Globe } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale } from "@/i18n/constants";
import { setClientLocale } from "@/i18n/client-locale";

/**
 * Offline page displayed when the server is unreachable.
 *
 * Features:
 * - Displays a message indicating the server is offline
 * - Provides a manual reload button to retry connection
 * - Language switcher to change the interface language
 */
export default function OfflinePage() {
  const t = useTranslations();

  const handleReload = () => {
    // Force complete page reload bypassing all caches
    if (typeof window !== 'undefined') {
      // Method 1: Use location.reload(true) - deprecated but works
      // Method 2: Use location.href with timestamp to bypass cache
      const timestamp = new Date().getTime();
      window.location.href = `/?t=${timestamp}`;
    }
  };

  const handleLanguageChange = (newLocale: Locale) => {
    setClientLocale(newLocale);
    window.dispatchEvent(new Event('ciel:locale-change'));
  };

  return (
    <PageContainer className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-12">
            <Moon className="h-32 w-32 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t("offline.title")}</CardTitle>
          <CardDescription className="text-base mt-3">
            {t("offline.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button onClick={handleReload} variant="primary" size="lg">
            {t("offline.reload")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <Globe className="w-4 h-4 mr-2" />
                {t("setup.welcome.changeLanguage")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleLanguageChange("ja")}>
                {t("language.japanese")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
                {t("language.english")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </div>
    </PageContainer>
  );
}
