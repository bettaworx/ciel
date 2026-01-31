"use client";

import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// Hooks
import { useAuth } from "@/lib/hooks/use-auth";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

// Atoms
import { isAuthenticatedAtom, userAtom } from "@/atoms/auth";
import { themeAtom, type Theme } from "@/atoms/theme";

// i18n
import { LOCALE_COOKIE_NAME, locales, type Locale } from "@/i18n/constants";

// Utils
import { getCookie, setSecureCookie } from "@/lib/utils/cookie";

// Components
import { Button } from "@/components/ui/button";
import { DesktopUserMenu } from "@/components/auth/DesktopUserMenu";
import { MobileUserMenu } from "@/components/auth/MobileUserMenu";
import { MobileLogoutConfirm } from "@/components/auth/MobileLogoutConfirm";

// Types
type MenuView = 'main' | 'theme' | 'language';

// Get current locale from cookie
function getCurrentLocale(): Locale {
  if (typeof document === "undefined") return "ja";
  const locale = getCookie(LOCALE_COOKIE_NAME);
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return "ja";
}

export function AuthButtons() {
  const t = useTranslations();
  const router = useRouter();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const user = useAtomValue(userAtom);
  const { logout } = useAuth();

  // レスポンシブ判定 (640px以上がデスクトップ)
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // 状態管理
  const [menuView, setMenuView] = useState<MenuView>('main');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [theme, setTheme] = useAtom(themeAtom);
  const [locale, setLocale] = useState<Locale>(getCurrentLocale());

  // メニューが開くたびにメイン画面にリセット
  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
    if (open) {
      setMenuView('main');
    }
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    setIsLogoutOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutOpen(false);
    await logout();
    // Page will be reloaded by logout function
  };

	const handleLanguageChange = (newLocale: Locale) => {
		setLocale(newLocale);
		// Set cookie with Secure flag in production
		setSecureCookie(LOCALE_COOKIE_NAME, newLocale);
		window.dispatchEvent(new Event('ciel:locale-change'));
	};

  const handleUserInfoClick = () => {
    if (user) {
      setIsMenuOpen(false);
      router.push(`/users/${user.username}`);
    }
  };

  const handleProfileClick = () => {
    if (user) {
      setIsMenuOpen(false);
      router.push(`/users/${user.username}`);
    }
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    router.push("/settings");
  };

  if (isAuthenticated && user) {
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
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onUserInfoClick={handleUserInfoClick}
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
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onUserInfoClick={handleUserInfoClick}
        />

        <MobileLogoutConfirm
          open={isLogoutOpen}
          onOpenChange={setIsLogoutOpen}
          onConfirm={handleLogoutConfirm}
        />
      </>
    );
  }

  // 未認証ユーザー
  return (
    <>
      <Button variant="secondary" onClick={() => router.push("/login")}>
        {t("login.title")}
      </Button>
      <Button variant="primary" onClick={() => router.push("/signup")}>
        {t("signup.createAccount")}
      </Button>
    </>
  );
}
