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
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Globe, Ellipsis, Info } from "lucide-react";
import { type Locale } from "@/i18n/constants";
import { useServerInfo } from "@/lib/hooks/use-queries";
import { setClientLocale } from "@/i18n/client-locale";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

/**
 * WelcomeCard - 未ログインユーザー向けのウェルカムメッセージカード
 * Displays welcome message and auth buttons for unauthenticated users
 */
export function WelcomeCard() {
  const t = useTranslations();
  const router = useRouter();
  const { data: serverInfo } = useServerInfo();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const handleLanguageChange = (newLocale: Locale) => {
    setClientLocale(newLocale);
    window.dispatchEvent(new Event('ciel:locale-change'));
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl flex flex-col justify-between p-6 gap-6 aspect-square sm:aspect-auto">
      <div className="flex flex-row justify-start items-start gap-6 h-fit grow">
        <div className="h-full flex flex-col text-left justify-center items-left grow py-6">
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
          <div className="text-xs sm:text-sm text-muted-foreground">
            <MfmRenderer
              text={serverInfo?.serverDescription || t("welcome.descriptionFallback")}
            />
          </div>
        </div>
        <div>
          {isDesktop ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="icon">
                  <Ellipsis className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/about")}>
                  <Info className="w-4 h-4" />
                  {t("welcome.aboutServer")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/version")}>
                  <Info className="w-4 h-4" />
                  {t("nav.versionInfo")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="default" size="icon">
                  <Ellipsis className="w-4 h-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex flex-col gap-1 p-2 pb-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => router.push("/about")}
                  >
                    <Info className="w-4 h-4" />
                    {t("welcome.aboutServer")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => router.push("/version")}
                  >
                    <Info className="w-4 h-4" />
                    {t("nav.versionInfo")}
                  </Button>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </div>
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
