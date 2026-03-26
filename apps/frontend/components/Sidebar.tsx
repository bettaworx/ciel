"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAtomValue, useAtom } from "jotai";
import { Home, SquarePen, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarAvatar } from "@/components/SidebarAvatar";
import { SidebarActionButton } from "@/components/SidebarActionButton";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { isAuthenticatedAtom } from "@/atoms/auth";
import { sidebarPinnedAtom, sidebarExpandedAtom } from "@/atoms/sidebar";
import { useServerInfo } from "@/lib/hooks/use-queries";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [isPinned, setIsPinned] = useAtom(sidebarPinnedAtom);
  const [, setIsExpanded] = useAtom(sidebarExpandedAtom);
  const { data: serverInfo } = useServerInfo();
  const canExpand = useMediaQuery("(min-width: 1280px)");
  const tNav = useTranslations("nav");
  const tCreatePost = useTranslations("createPost");

  const isExpanded = canExpand && (isHovered || isPinned);
  const isTopControlsVisible = canExpand && isHovered;

  useEffect(() => {
    setIsExpanded(canExpand && isPinned);
  }, [isPinned, canExpand, setIsExpanded]);

  const hoverBg = "hover:bg-sidebar-hover";

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-dvh w-auto xl:max-w-[306px] 2xl:max-w-[480px] flex flex-col justify-between p-2 z-40",
          "overflow-hidden",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            "flex items-center h-16 gap-2",
            !isExpanded && "justify-center",
          )}
        >
          <Link href="/" aria-label={tNav("home")}>
            <div
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-2xl cursor-pointer shrink-0",
                hoverBg,
              )}
            >
              {serverInfo?.serverIconUrl ? (
                <Image
                  src={serverInfo.serverIconUrl}
                  alt="Server icon"
                  width={48}
                  height={48}
                  unoptimized
                  className="rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-xl" />
              )}
            </div>
          </Link>

          <div
            className={cn(
              "flex items-center shrink-0 gap-2 justify-start",
              isTopControlsVisible ? "w-10" : "hidden",
            )}
          >
            <Button
              variant="ghost"
              rounded="lg"
              className={cn(
                "w-10 h-10 transition-none",
                isPinned && "bg-accent/60",
                hoverBg,
              )}
              onClick={() => setIsPinned(!isPinned)}
              aria-label={
                isPinned ? "サイドバーのピンを解除" : "サイドバーを固定"
              }
              tabIndex={isTopControlsVisible ? 0 : -1}
            >
              {isPinned ? (
                <PinOff className="w-4 h-4" />
              ) : (
                <Pin className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SidebarActionButton
            href="/"
            icon={<Home className="w-6 h-6 shrink-0" />}
            label={tNav("home")}
            isExpanded={isExpanded}
            hoverBg={hoverBg}
          />
        </div>

        <div className="flex flex-col gap-2">
          {isAuthenticated && (
            <SidebarActionButton
              icon={<SquarePen className="w-6 h-6 shrink-0" />}
              label={tCreatePost("title")}
              isExpanded={isExpanded}
              hoverBg={hoverBg}
              onClick={() => setIsPostDialogOpen(true)}
            />
          )}
          <SidebarAvatar isExpanded={isExpanded} isPinned={isPinned} />
        </div>
      </aside>

      {isAuthenticated && (
        <CreatePostDialog
          open={isPostDialogOpen}
          onOpenChange={setIsPostDialogOpen}
        />
      )}
    </>
  );
}
