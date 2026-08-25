"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountEntry } from "@/atoms/accounts";

// Hooks
import { useAuth } from "@/lib/hooks/use-auth";
import { useAccountSwitch } from "@/lib/hooks/use-account-switch";
import { useAccountUnread } from "@/lib/hooks/use-account-unread";

/**
 * ユーザーメニューの状態管理とイベントハンドラーを提供するカスタムフック
 * Provides state management and event handlers for user menu
 */
export function useUserMenu() {
  const router = useRouter();
  const { logout } = useAuth();
  const { switchTo } = useAccountSwitch();

  // 状態管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // 他アカウントの未読件数（バッジ用）をポーリングで取得する
  useAccountUnread();

  const handleMenuOpenChange = (open: boolean) => {
    setIsMenuOpen(open);
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

  const handleUserInfoClick = (username: string) => {
    setIsMenuOpen(false);
    router.push(`/users/${username}`);
  };

  const handleProfileClick = (username: string) => {
    setIsMenuOpen(false);
    router.push(`/users/${username}`);
  };

  const handleBookmarksClick = () => {
    setIsMenuOpen(false);
    router.push("/bookmarks");
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    router.push("/settings");
  };

  const handleAccountClick = async (account: AccountEntry) => {
    setIsMenuOpen(false);
    await switchTo(account);
  };

  const handleAddAccount = () => {
    setIsMenuOpen(false);
    router.push("/login");
  };

  return {
    // 状態
    isMenuOpen,
    setIsMenuOpen,
    isLogoutOpen,
    setIsLogoutOpen,

    // イベントハンドラー
    handleMenuOpenChange,
    handleLogoutClick,
    handleLogoutConfirm,
    handleUserInfoClick,
    handleProfileClick,
    handleBookmarksClick,
    handleSettingsClick,
    handleAccountClick,
    handleAddAccount,
  };
}
