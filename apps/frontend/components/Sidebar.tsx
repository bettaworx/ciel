"use client";

import { useState } from "react";
import Link from "next/link";
import { useAtomValue } from "jotai";
import { Home, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarAvatar } from "@/components/SidebarAvatar";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { isAuthenticatedAtom } from "@/atoms/auth";
import { useTranslations } from "next-intl";

/**
 * デスクトップ用の左側固定サイドバー
 * Desktop left sidebar (fixed position)
 */
export function Sidebar() {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const tNav = useTranslations("nav");
  const tCreatePost = useTranslations("createPost");

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-auto bg-background-1 flex flex-col items-center justify-between p-2 z-40">
        {/* 上部: ホームボタン */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" aria-label={tNav("home")}>
            <Button variant="ghost" rounded="lg" className="w-14 h-14">
              <Home className="w-full h-full" />
            </Button>
          </Link>
        </div>

        {/* 下部: アバター（認証済みの場合のみ表示） */}
        <div className="flex flex-col items-center gap-2">
          {isAuthenticated && (
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
          <SidebarAvatar />
        </div>
      </aside>

      {/* Create Post Dialog */}
      {isAuthenticated && (
        <CreatePostDialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen} />
      )}
    </>
  );
}
