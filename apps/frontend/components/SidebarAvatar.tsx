"use client";

import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/auth";
import { useUserMenu } from "@/lib/hooks/use-user-menu";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

// Components
import { DesktopUserMenu } from "@/components/auth/DesktopUserMenu";
import { MobileUserMenu } from "@/components/auth/MobileUserMenu";
import { MobileLogoutConfirm } from "@/components/auth/MobileLogoutConfirm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * サイドバー用のアバターコンポーネント
 * Avatar component for sidebar with menu functionality
 */
export function SidebarAvatar() {
  const user = useAtomValue(userAtom);
  const isDesktop = useMediaQuery("(min-width: 640px)");

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

  if (!user) return null;

  const initials = (user.displayName?.[0] || user.username[0]).toUpperCase();

  return (
    <Button variant="link" className="w-14 h-14" aria-label="User menu">
      <Avatar className="w-12 h-12">
        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
