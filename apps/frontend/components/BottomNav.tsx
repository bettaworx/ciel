"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { Home, SquarePen, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { SidebarAvatar } from "@/components/SidebarAvatar";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { isAuthenticatedAtom } from "@/atoms/auth";
import { useTranslations } from "next-intl";

/**
 * モバイル用の下部固定ナビゲーションバー
 * Mobile bottom navigation bar (fixed position)
 */
export function BottomNav() {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tCreatePost = useTranslations("createPost");

  const handleHomeClick = () => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  // Prevent hydration mismatch by only rendering auth-dependent UI after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background-1 flex items-center justify-between px-8 z-40 border-t border-border">
        {/* ホームボタン */}
        <Button
          variant="ghost"
          rounded="lg"
          className="w-12 h-12"
          onClick={handleHomeClick}
          aria-label={tNav("home")}
        >
          <Home className="w-6 h-6" />
        </Button>

        {/* 通知ボタン */}
        {isMounted && isAuthenticated && (
          <Button
            variant="ghost"
            rounded="lg"
            className="w-12 h-12"
            onClick={() => router.push("/notifications")}
            aria-label={tNav("notifications")}
          >
            <span className="relative flex">
              <Bell className="w-6 h-6" />
              {/* Centred on the icon's top-right corner, so it clears the glyph
                  regardless of how many digits it renders. */}
              <NotificationBadge className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 ring-2 ring-background-1" />
            </span>
          </Button>
        )}

        {/* 投稿ボタン */}
        {isMounted && isAuthenticated && (
          <Button
            variant="ghost"
            rounded="lg"
            className="w-12 h-12"
            onClick={() => setIsPostDialogOpen(true)}
            aria-label={tCreatePost("title")}
          >
            <SquarePen className="w-6 h-6" />
          </Button>
        )}

        {/* アバター（認証済みの場合のみ表示） */}
        <div className="flex items-center">
          <SidebarAvatar />
        </div>
      </div>

      {/* Create Post Dialog */}
      {isMounted && isAuthenticated && (
        <CreatePostDialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen} />
      )}
    </>
  );
}
