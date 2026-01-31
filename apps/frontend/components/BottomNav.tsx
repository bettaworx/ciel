"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { Home, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const tNav = useTranslations("nav");
  const tCreatePost = useTranslations("createPost");

  // Prevent hydration mismatch by only rendering auth-dependent UI after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background-1 flex items-center justify-around px-4 z-40">
        {/* ホームボタン */}
        <Link href="/" aria-label={tNav("home")}>
          <Button variant="ghost" rounded="lg" className="w-10 h-10">
            <Home className="w-9 h-9" />
          </Button>
        </Link>

        {/* 投稿ボタン */}
        {isMounted && isAuthenticated && (
          <Button
            variant="ghost"
            rounded="lg"
            className="w-14 h-14"
            onClick={() => setIsPostDialogOpen(true)}
            aria-label={tCreatePost("title")}
          >
            <SquarePen className="w-full h-full" />
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
