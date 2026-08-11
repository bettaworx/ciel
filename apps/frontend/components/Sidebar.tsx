"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAtomValue, useAtom } from "jotai";
import { Home, SquarePen, Pin, PinOff, Info, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarAvatar } from "@/components/SidebarAvatar";
import { SidebarActionButton } from "@/components/SidebarActionButton";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { isAuthenticatedAtom } from "@/atoms/auth";
import {
  sidebarPinnedAtom,
  sidebarExpandedAtom,
  sidebarMenuOpenAtom,
} from "@/atoms/sidebar";
import {
  useServerInfo,
  useUnreadNotificationCount,
} from "@/lib/hooks/use-queries";
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
  const [isMenuOpen, setIsMenuOpen] = useAtom(sidebarMenuOpenAtom);
  const { data: serverInfo } = useServerInfo();
  const { data: unread } = useUnreadNotificationCount();
  const unreadCount = unread?.count ?? 0;
  const canExpand = useMediaQuery("(min-width: 1280px)");
  // ServerInfo carries no host, so read it off the browser. In an effect to
  // keep the SSR markup and the hydrated markup identical.
  const [host, setHost] = useState("");
  useEffect(() => setHost(window.location.host), []);
  const tNav = useTranslations("nav");
  const tCreatePost = useTranslations("createPost");

  const isExpanded = canExpand && (isHovered || isPinned || isMenuOpen);
  const isTopControlsVisible = canExpand && isHovered;

  useEffect(() => {
    setIsExpanded(isExpanded);
  }, [isExpanded, setIsExpanded]);

  const asideRef = useRef<HTMLElement>(null);

  // An open menu covers the sidebar and blocks pointer events, so mouseleave
  // never fires and the hover state goes stale. Rather than assume the pointer
  // left, ask the DOM once the menu is gone — otherwise closing the menu with
  // the pointer still on the sidebar collapses it, and navigating away from a
  // menu item leaves it stuck open. A frame's delay lets the overlay release
  // pointer events first, without which nothing can match :hover.
  const prevIsMenuOpenRef = useRef(isMenuOpen);
  useEffect(() => {
    if (prevIsMenuOpenRef.current && !isMenuOpen) {
      const frame = requestAnimationFrame(() =>
        setIsHovered(asideRef.current?.matches(":hover") ?? false),
      );
      prevIsMenuOpenRef.current = isMenuOpen;
      return () => cancelAnimationFrame(frame);
    }
    prevIsMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

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
        ref={asideRef}
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
        <div className="flex items-center justify-between h-12 gap-3">
          {/* Radix owns the open state; mirror it so the sidebar stays
              expanded while the dropdown is up. */}
          <DropdownMenu onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarActionButton
                icon={
                  <motion.div
                    initial={false}
                    animate={{
                      width: isExpanded ? 36 : 48,
                      height: isExpanded ? 36 : 48,
                      borderRadius: isExpanded ? "12px" : "16px",
                    }}
                    transition={
                      canExpand
                        ? { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                        : { duration: 0 }
                    }
                    className={cn(
                      "shrink-0 overflow-hidden",
                      isExpanded ? "h-9 w-9" : "h-12 w-12",
                    )}
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
                      <div className="w-full h-full bg-primary" />
                    )}
                  </motion.div>
                }
                label={serverInfo?.serverName || host}
                subLabel={serverInfo?.serverName ? host : undefined}
                textWidth={128}
                isExpanded={isExpanded}
                canAnimate={canExpand}
                className="w-auto"
                aria-label={tNav("serverInfo")}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
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

        <div className="flex flex-col gap-1.5 grow">
          <SidebarActionButton
            onClick={handleHomeClick}
            icon={<Home className="w-5 h-5 shrink-0" />}
            label={tNav("home")}
            isActive={pathname === "/"}
            isExpanded={isExpanded}
            canAnimate={canExpand}
            hoverBg={hoverBg}
          />
          {isAuthenticated && (
            <SidebarActionButton
              href="/notifications"
              icon={
                <span className="relative flex shrink-0">
                  <Bell className="w-5 h-5" />
                  {/* A dot while collapsed, because the count shows up once the
                      sidebar expands. Where it can never expand, that count is
                      unreachable, so put the number on the icon instead. */}
                  {!isExpanded && (
                    <NotificationBadge
                      variant={canExpand ? "dot" : "count"}
                      className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 ring-2 ring-background"
                    />
                  )}
                </span>
              }
              label={tNav("notifications")}
              trailingIcon={
                isExpanded && unreadCount > 0 ? <NotificationBadge /> : undefined
              }
              isActive={pathname === "/notifications"}
              isExpanded={isExpanded}
              canAnimate={canExpand}
              hoverBg={hoverBg}
            />
          )}
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
