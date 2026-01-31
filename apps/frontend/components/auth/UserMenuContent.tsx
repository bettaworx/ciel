"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Palette,
  Languages,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { components } from "@/lib/api/api";
import type { Theme } from "@/atoms/theme";
import type { Locale } from "@/i18n/constants";

type UserType = components["schemas"]["User"];

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSlideAnimation } from "@/lib/hooks/use-slide-animation";
import { cn } from "@/lib/utils";

type MenuView = "main" | "theme" | "language";

interface UserMenuContentProps {
  user: UserType;
  initials: string;
  currentView: MenuView;
  onViewChange: (view: MenuView) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  locale: Locale;
  onLanguageChange: (locale: Locale) => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  onUserInfoClick?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function UserMenuContent({
  user,
  initials,
  currentView,
  onViewChange,
  theme,
  onThemeChange,
  locale,
  onLanguageChange,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  onUserInfoClick,
  onClose,
  isMobile = false,
}: UserMenuContentProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);

  useSlideAnimation({
    currentView,
    containerRef,
    duration: 0.3,
    ease: "power2.inOut",
  });

  const handleThemeSelect = (newTheme: Theme) => {
    onThemeChange(newTheme);
  };

  const handleLanguageSelect = (newLocale: Locale) => {
    onLanguageChange(newLocale);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden [transform:translateZ(0)] [backface-visibility:hidden] [perspective:1000px]", 
        isMobile ? "w-full" : "w-64"
      )}
    >
      {/* ====== メイン画面 ====== */}
      <div
        data-view="main"
        className={cn(
          "w-full relative [transform:translateZ(0)]",
          currentView === "main" ? "block" : "hidden",
        )}
      >
        {/* ユーザー情報ヘッダー */}
        <div
          className={cn(
            "flex flex-col items-center gap-2 p-4 transition-colors relative",
            onUserInfoClick && "cursor-pointer",
          )}
          onClick={onUserInfoClick}
        >
          <Avatar className="h-16 w-16">
            {user.avatarUrl && (
              <AvatarImage
                src={user.avatarUrl}
                alt={user.displayName || user.username}
              />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <div className="font-semibold">
              {user.displayName || user.username}
            </div>
            <div className="text-sm text-muted-foreground">
              @{user.username}
            </div>
          </div>

          {/* Xボタン（デスクトップのみ） */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              rounded="md"
              className="absolute top-1.5 right-2 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={t("userMenu.closeMenu")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Separator />

        {/* メニュー項目 */}
        <div className="p-2 space-y-1">
          <Button
            variant="ghost"
            rounded="md"
            className="w-full justify-start"
            onClick={onProfileClick}
          >
            <User className="h-4 w-4" />
            {t("userMenu.viewProfile")}
          </Button>

          <Button
            variant="ghost"
            rounded="md"
            className="w-full justify-between"
            onClick={() => onViewChange("theme")}
          >
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t("userMenu.theme")}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            rounded="md"
            className="w-full justify-between"
            onClick={() => onViewChange("language")}
          >
            <span className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              {t("userMenu.language")}
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            rounded="md"
            className="w-full justify-start"
            onClick={onSettingsClick}
          >
            <SettingsIcon className="h-4 w-4" />
            {t("settings.title")}
          </Button>
        </div>
        <Separator />

        <div className="space-y-1 p-2">
          <Button
            variant="ghost"
            rounded="md"
            className="w-full justify-start !text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 [&>svg]:!text-destructive"
            onClick={onLogoutClick}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </div>

      {/* ====== テーマ選択画面 ====== */}
      <div
        data-view="theme"
        className={cn(
          "absolute top-0 w-full [transform:translateZ(0)]",
          currentView === "theme" ? "block" : "hidden",
        )}
      >
        {/* ヘッダー: < テーマ */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-2"
            onClick={() => onViewChange("main")}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-base font-semibold">{t("userMenu.theme")}</h3>
        </div>

        {/* テーマ選択 */}
        <div className="p-4">
          <RadioGroup value={theme} onValueChange={handleThemeSelect}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="flex-1 cursor-pointer">
                  {t("settings.appearance.theme.light")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="flex-1 cursor-pointer">
                  {t("settings.appearance.theme.dark")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="flex-1 cursor-pointer">
                  {t("settings.appearance.theme.system")}
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* ====== 言語選択画面 ====== */}
      <div
        data-view="language"
        className={cn(
          "absolute top-0 w-full [transform:translateZ(0)]",
          currentView === "language" ? "block" : "hidden",
        )}
      >
        {/* ヘッダー: < 言語 */}
        <div className="flex items-center gap-2 p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-2"
            onClick={() => onViewChange("main")}
            aria-label={t("common.back")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-base font-semibold">{t("userMenu.language")}</h3>
        </div>

        {/* 言語選択 */}
        <div className="p-4">
          <RadioGroup value={locale} onValueChange={handleLanguageSelect}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ja" id="lang-ja" />
                <Label htmlFor="lang-ja" className="flex-1 cursor-pointer">
                  {t("settings.language.ja")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en" className="flex-1 cursor-pointer">
                  {t("settings.language.en")}
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
