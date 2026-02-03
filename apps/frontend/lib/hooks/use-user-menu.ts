"use client";

import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useRouter } from "next/navigation";

// Atoms
import { themeAtom, type Theme } from "@/atoms/theme";

// Hooks
import { useAuth } from "@/lib/hooks/use-auth";

// i18n
import { LOCALE_STORAGE_KEY, locales, defaultLocale, type Locale } from "@/i18n/constants";

// Utils
import { setClientLocale } from "@/i18n/client-locale";

// Types
export type MenuView = 'main' | 'theme' | 'language';

// Get current locale from local storage
function getCurrentLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale;
  }
  return defaultLocale;
}

/**
 * ユーザーメニューの状態管理とイベントハンドラーを提供するカスタムフック
 * Provides state management and event handlers for user menu
 */
export function useUserMenu() {
  const router = useRouter();
  const { logout } = useAuth();

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
		setClientLocale(newLocale);
		window.dispatchEvent(new Event('ciel:locale-change'));
	};

  const handleUserInfoClick = (username: string) => {
    setIsMenuOpen(false);
    router.push(`/users/${username}`);
  };

  const handleProfileClick = (username: string) => {
    setIsMenuOpen(false);
    router.push(`/users/${username}`);
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    router.push("/settings");
  };

  return {
    // 状態
    menuView,
    setMenuView,
    isMenuOpen,
    setIsMenuOpen,
    isLogoutOpen,
    setIsLogoutOpen,
    theme,
    setTheme,
    locale,
    
    // イベントハンドラー
    handleMenuOpenChange,
    handleLogoutClick,
    handleLogoutConfirm,
    handleLanguageChange,
    handleUserInfoClick,
    handleProfileClick,
    handleSettingsClick,
  };
}
