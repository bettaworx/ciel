"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { Home, Search, SquarePen, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { SidebarAvatar } from "@/components/SidebarAvatar";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { isAuthenticatedAtom } from "@/atoms/auth";
import { useServerInfo } from "@/lib/hooks/use-queries";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * ボタン本体は48pxのタップ領域のまま、見た目のシェイプは内側の40pxが持つ。
 * 隣に並ぶアバター（MobileUserMenu）と同じ入れ子・同じ大きさ・同じ角丸に揃えるため。
 */
function NavButton({
  icon,
  label,
  isActive = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="group w-12 h-12 p-0 hover:bg-transparent"
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          isActive
            ? "bg-c-1/15 text-c-1 group-hover:bg-c-1/25"
            : "group-hover:bg-sidebar-hover",
        )}
      >
        {icon}
      </span>
    </Button>
  );
}

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
  const { data: serverInfo } = useServerInfo();
  // Show while the server info is still loading and hide only once search is
  // known to be off, so the bar does not grow an extra button after mount.
  const showSearch = serverInfo?.searchEnabled !== false;

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
        {/* アバター（認証済みの場合のみ表示） */}
        <div className="flex items-center">
          <SidebarAvatar />
        </div>

        {/* ホームボタン */}
        <NavButton
          icon={<Home className="w-6 h-6" />}
          label={tNav("home")}
          isActive={pathname === "/"}
          onClick={handleHomeClick}
        />

        {/* 検索ボタン */}
        {isMounted && isAuthenticated && showSearch && (
          <NavButton
            icon={<Search className="w-6 h-6" />}
            label={tNav("search")}
            isActive={pathname === "/search"}
            onClick={() => router.push("/search")}
          />
        )}

        {/* 通知ボタン */}
        {isMounted && isAuthenticated && (
          <NavButton
            icon={
              <span className="relative flex">
                <Bell className="w-6 h-6" />
                {/* Centred on the icon's top-right corner, so it clears the glyph
                    regardless of how many digits it renders. */}
                <NotificationBadge className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 ring-2 ring-background-1" />
              </span>
            }
            label={tNav("notifications")}
            isActive={pathname === "/notifications"}
            onClick={() => router.push("/notifications")}
          />
        )}

        {/* 投稿ボタン */}
        {isMounted && isAuthenticated && (
          <NavButton
            icon={<SquarePen className="w-6 h-6" />}
            label={tCreatePost("title")}
            onClick={() => setIsPostDialogOpen(true)}
          />
        )}
      </div>

      {/* Create Post Dialog */}
      {isMounted && isAuthenticated && (
        <CreatePostDialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen} />
      )}
    </>
  );
}
