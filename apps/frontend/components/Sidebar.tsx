"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue, useAtom } from "jotai";
import { Home, SquarePen, Pin, PinOff, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarAvatar } from "@/components/SidebarAvatar";
import { SidebarActionButton } from "@/components/SidebarActionButton";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { isAuthenticatedAtom } from "@/atoms/auth";
import {
  sidebarPinnedAtom,
  sidebarExpandedAtom,
  sidebarMenuOpenAtom,
} from "@/atoms/sidebar";
import { useServerInfo } from "@/lib/hooks/use-queries";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useTranslations } from "next-intl";
import { motion, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const router = useRouter();
  const [isPinned, setIsPinned] = useAtom(sidebarPinnedAtom);
  const [, setIsExpanded] = useAtom(sidebarExpandedAtom);
  const isMenuOpen = useAtomValue(sidebarMenuOpenAtom);
  const { data: serverInfo } = useServerInfo();
  const canExpand = useMediaQuery("(min-width: 1280px)");
  const tNav = useTranslations("nav");
  const tCreatePost = useTranslations("createPost");

  const isExpanded = canExpand && (isHovered || isPinned || isMenuOpen);
  const isTopControlsVisible = canExpand && isHovered;

  useEffect(() => {
    setIsExpanded(isExpanded);
  }, [isExpanded, setIsExpanded]);

  const prevIsMenuOpenRef = useRef(isMenuOpen);
  useEffect(() => {
    if (prevIsMenuOpenRef.current && !isMenuOpen && !isPinned) {
      setIsHovered(false);
    }
    prevIsMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen, isPinned]);

  const [pinIconRef, animatePinIcon] = useAnimate();
  const hoverBg = "hover:bg-sidebar-hover";

  const handleHomeClick = () => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  const handlePinToggle = () => {
    const y = isPinned ? -3 : 3;
    animatePinIcon(
      pinIconRef.current,
      { y: [0, y, 0] },
      { duration: 0.2, ease: "circOut" },
    );
    setIsPinned(!isPinned);
  };

  return (
    <>
      <motion.aside
        animate={{ width: isExpanded ? 256 : 72 }}
        transition={
          canExpand
            ? { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
            : { duration: 0 }
        }
        className="fixed left-0 top-0 h-dvh flex flex-col p-3 z-40 gap-3 overflow-hidden"
        onMouseEnter={(e) => {
          if (isMenuOpen && !isPinned) {
            if (e.clientX <= 72) setIsHovered(true);
          } else {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center h-12 gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center justify-center w-[48px] h-[48px] rounded-2xl cursor-pointer shrink-0 overflow-hidden",
                  hoverBg,
                )}
                aria-label={tNav("serverInfo")}
              >
                {serverInfo?.serverIconUrl ? (
                  <Image
                    src={serverInfo.serverIconUrl}
                    alt="Server icon"
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary rounded-2xl" />
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              <DropdownMenuItem onClick={() => router.push("/about")}>
                <Info className="w-4 h-4" />
                {tNav("serverInfo")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/version")}>
                <Info className="w-4 h-4" />
                {tNav("versionInfo")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <motion.div
            animate={{ opacity: isTopControlsVisible ? 1 : 0 }}
            transition={
              canExpand
                ? { duration: 0.15, ease: "easeInOut" }
                : { duration: 0 }
            }
            className="flex items-center shrink-0 gap-2 justify-start"
            style={{ pointerEvents: isTopControlsVisible ? "auto" : "none" }}
          >
            <Button
              variant="ghost"
              rounded="md"
              className={cn(
                "w-10 h-10 transition-none",
                isPinned && "bg-accent/60",
                hoverBg,
              )}
              onClick={handlePinToggle}
              aria-label={tNav(isPinned ? "unpinSidebar" : "pinSidebar")}
              tabIndex={isTopControlsVisible ? 0 : -1}
            >
              <span ref={pinIconRef} className="flex">
                {isPinned ? (
                  <PinOff className="w-4 h-4" />
                ) : (
                  <Pin className="w-4 h-4" />
                )}
              </span>
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3 grow">
          <SidebarActionButton
            onClick={handleHomeClick}
            icon={<Home className="w-5 h-5 shrink-0" />}
            label={tNav("home")}
            isActive={pathname === "/"}
            isExpanded={isExpanded}
            canAnimate={canExpand}
            hoverBg={hoverBg}
          />
        </div>

        <div className="flex flex-col gap-3">
          {isAuthenticated && (
            <SidebarActionButton
              icon={<SquarePen className="w-5 h-5 shrink-0" />}
              label={tCreatePost("title")}
              isExpanded={isExpanded}
              canAnimate={canExpand}
              buttonVariant="sidebar_primary"
              onClick={() => setIsPostDialogOpen(true)}
            />
          )}
          <SidebarAvatar
            isExpanded={isExpanded}
            isPinned={isPinned}
            canAnimate={canExpand}
          />
        </div>
      </motion.aside>

      {isAuthenticated && (
        <CreatePostDialog
          open={isPostDialogOpen}
          onOpenChange={setIsPostDialogOpen}
        />
      )}
    </>
  );
}
