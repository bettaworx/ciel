"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { LOCALE_COOKIE_NAME, type Locale } from "@/i18n/constants";
import { useServerInfo } from "@/lib/hooks/use-queries";
import { setSecureCookie } from "@/lib/utils/cookie";

/**
 * WelcomeCard - 未ログインユーザー向けのウェルカムメッセージカード
 * Displays welcome message and auth buttons for unauthenticated users
 */
export function WelcomeCard() {
  const t = useTranslations();
  const router = useRouter();
  const { data: serverInfo } = useServerInfo();

	const handleLanguageChange = (newLocale: Locale) => {
		// Set cookie with Secure flag in production
		setSecureCookie(LOCALE_COOKIE_NAME, newLocale);
		window.dispatchEvent(new Event('ciel:locale-change'));
	};

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl flex flex-col justify-between p-6 gap-6 aspect-square sm:aspect-auto">
      <div className="flex flex-col text-left justify-center items-left grow py-6">
        {/* Server icon: アイコンがあれば画像表示、なければbg-primaryの角丸プレースホルダー */}
        {serverInfo?.serverIconUrl ? (
          <Image
            src={serverInfo.serverIconUrl}
            alt="Server icon"
            width={128}
            height={128}
            unoptimized
            className="rounded-2xl object-cover mb-6"
          />
        ) : (
          <div className="w-32 h-32 bg-primary rounded-2xl mb-6" />
        )}
        <h1 className="text-xl sm:text-3xl font-bold">
          {t("welcome.title", {
            serverName: serverInfo?.serverName || "Ciel",
          })}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t("welcome.description", {
            serverDescription:
              serverInfo?.serverDescription || t("welcome.descriptionFallback"),
          })}
        </p>
      </div>
      <div className="flex flex-row justify-between gap-3">
        <div className="flex flex-row gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="sm:w-auto">
                <Globe className="sm:ml-4 w-4 h-4 sm:mr-2" />
                <div className="hidden sm:block sm:mr-4">
                  {t("setup.welcome.changeLanguage")}
                </div>
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
        </div>
        <div className="flex flex-row gap-3">
          <Button onClick={() => router.push("/login")}>
            {t("login.title")}
          </Button>
          <Button variant="primary" onClick={() => router.push("/signup")}>
            {t("signup.createAccount")}
          </Button>
        </div>
      </div>
    </div>
  );
}
