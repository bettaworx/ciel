"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { userAtom } from "@/atoms/auth";
import { sidebarMenuOpenAtom } from "@/atoms/sidebar";
import { useUserMenu } from "@/lib/hooks/use-user-menu";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

// Components
import { DesktopUserMenu } from "@/components/auth/DesktopUserMenu";
import { MobileUserMenu } from "@/components/auth/MobileUserMenu";
import { MobileLogoutConfirm } from "@/components/auth/MobileLogoutConfirm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface SidebarAvatarProps {
  /** サイドバー展開時にユーザー名を表示するか */
  isExpanded?: boolean;
  /** ピン止め状態（ホバーカラー制御用） */
  isPinned?: boolean;
  /** アニメーション可能か */
  canAnimate?: boolean;
}

/**
 * サイドバー用のアバターコンポーネント
 * Avatar component for sidebar with menu functionality
 */
export function SidebarAvatar({ isExpanded = false, isPinned = false, canAnimate = true }: SidebarAvatarProps) {
  const user = useAtomValue(userAtom);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const setMenuOpen = useSetAtom(sidebarMenuOpenAtom);

  const {
    menuView,
    setMenuView,
    isMenuOpen,
    isLogoutOpen,
    setIsLogoutOpen,
    theme,
    setTheme,
    locale,
    handleMenuOpenChange,
    handleLogoutClick,
    handleLogoutConfirm,
    handleLanguageChange,
    handleUserInfoClick,
    handleProfileClick,
    handleSettingsClick,
  } = useUserMenu();

  useEffect(() => {
    setMenuOpen(isMenuOpen);
    return () => setMenuOpen(false);
  }, [isMenuOpen, setMenuOpen]);

  if (!user) return null;

  const initials = (user.displayName?.[0] || user.username[0]).toUpperCase();

  // デスクトップ表示
  if (isDesktop) {
    return (
      <DesktopUserMenu
        user={user}
        initials={initials}
        isOpen={isMenuOpen}
        onOpenChange={handleMenuOpenChange}
        currentView={menuView}
        onViewChange={setMenuView}
        isLogoutOpen={isLogoutOpen}
        onLogoutOpenChange={setIsLogoutOpen}
        theme={theme}
        onThemeChange={setTheme}
        locale={locale}
        onLanguageChange={handleLanguageChange}
        onLogoutClick={handleLogoutClick}
        onLogoutConfirm={handleLogoutConfirm}
        onProfileClick={() => handleProfileClick(user.username)}
        onSettingsClick={handleSettingsClick}
        onUserInfoClick={() => handleUserInfoClick(user.username)}
        isExpanded={isExpanded}
        canAnimate={canAnimate}
      />
    );
  }

  // モバイル表示
  return (
    <>
      <MobileUserMenu
        user={user}
        initials={initials}
        isOpen={isMenuOpen}
        onOpenChange={handleMenuOpenChange}
        currentView={menuView}
        onViewChange={setMenuView}
        theme={theme}
        onThemeChange={setTheme}
        locale={locale}
        onLanguageChange={handleLanguageChange}
        onLogoutClick={handleLogoutClick}
        onProfileClick={() => handleProfileClick(user.username)}
        onSettingsClick={handleSettingsClick}
        onUserInfoClick={() => handleUserInfoClick(user.username)}
      />

      <MobileLogoutConfirm
        open={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}

/**
 * サイドバー用のアバターボタン（メニュートリガー用）
 * Avatar button for sidebar (menu trigger)
 */
export function SidebarAvatarButton() {
  const user = useAtomValue(userAtom);
  const tNav = useTranslations("nav");

  if (!user) return null;

  const initials = (user.displayName?.[0] || user.username[0]).toUpperCase();

  return (
    <Button variant="link" className="w-14 h-14" aria-label={tNav("openUserMenu")}>
      <Avatar className="w-12 h-12">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt={user.displayName || user.username} />
        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
