"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

// Hooks
import { useAuth } from "@/lib/hooks/use-auth";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

// Atoms
import { isAuthenticatedAtom, userAtom } from "@/atoms/auth";

// Components
import { Button } from "@/components/ui/button";
import { DesktopUserMenu } from "@/components/auth/DesktopUserMenu";
import { MobileUserMenu } from "@/components/auth/MobileUserMenu";
import { MobileLogoutConfirm } from "@/components/auth/MobileLogoutConfirm";

export function AuthButtons() {
  const t = useTranslations();
  const router = useRouter();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const user = useAtomValue(userAtom);
  const { logout } = useAuth();

  // レスポンシブ判定 (640px以上がデスクトップ)
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // 状態管理
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // メニューが開くたびにメイン画面にリセット
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

  const handleBookmarksClick = () => {
    setIsMenuOpen(false);
    router.push("/bookmarks");
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    router.push("/settings");
  };

  useEffect(() => {
    router.prefetch("/login");
    router.prefetch("/signup");
    router.prefetch("/settings");

    if (user?.username) {
      router.prefetch(`/users/${user.username}`);
    }
  }, [router, user?.username]);

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
          isLogoutOpen={isLogoutOpen}
          onLogoutOpenChange={setIsLogoutOpen}
          onLogoutClick={handleLogoutClick}
          onLogoutConfirm={handleLogoutConfirm}
          onProfileClick={handleProfileClick}
          onBookmarksClick={handleBookmarksClick}
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
          onLogoutClick={handleLogoutClick}
          onProfileClick={handleProfileClick}
          onBookmarksClick={handleBookmarksClick}
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
      <Button asChild variant="secondary">
        <Link href="/login" prefetch>
          {t("login.title")}
        </Link>
      </Button>
      <Button asChild variant="primary">
        <Link href="/signup" prefetch>
          {t("signup.createAccount")}
        </Link>
      </Button>
    </>
  );
}
