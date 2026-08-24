"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SidebarActionButton } from "@/components/SidebarActionButton";
import { UserMenuContent } from "./UserMenuContent";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { DisplayName } from "@/components/users/DisplayName";
import type { components } from "@/lib/api/api";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type User = components["schemas"]["User"];

interface DesktopUserMenuProps {
  user: User;
  initials: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLogoutOpen: boolean;
  onLogoutOpenChange: (open: boolean) => void;
  onLogoutClick: () => void;
  onLogoutConfirm: () => Promise<void>;
  onProfileClick: () => void;
  onBookmarksClick: () => void;
  onSettingsClick: () => void;
  onUserInfoClick: () => void;
  /** サイドバー展開時にユーザー名を表示するか */
  isExpanded?: boolean;
/** アニメーション可能か */
  canAnimate?: boolean;
}

export function DesktopUserMenu({
  user,
  initials,
  isOpen,
  onOpenChange,
  isLogoutOpen,
  onLogoutOpenChange,
  onLogoutClick,
  onLogoutConfirm,
  onProfileClick,
  onBookmarksClick,
  onSettingsClick,
  onUserInfoClick,
  isExpanded = false,
  canAnimate = true,
}: DesktopUserMenuProps) {
  const tNav = useTranslations("nav");

  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
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
                  canAnimate
                    ? { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
                    : { duration: 0 }
                }
                className={cn(
                  "shrink-0 overflow-hidden",
                  isExpanded ? "h-9 w-9" : "h-12 w-12",
                )}
              >
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage
                    src={user.avatarUrl ?? undefined}
                    alt={user.displayName || user.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold rounded-none">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            }
            label={
              user.displayName ? (
                <DisplayName
                  name={user.displayName}
                  isPrivate={user.isPrivate}
                />
              ) : (
                `@${user.username}`
              )
            }
            subLabel={user.displayName ? `@${user.username}` : undefined}
            trailingIcon={<MoreHorizontal className="w-4 h-4" />}
            isExpanded={isExpanded}
            canAnimate={canAnimate}

            className={isExpanded ? "w-full min-w-[180px]" : undefined}
            aria-label={tNav("openUserMenu")}
          />
        </PopoverTrigger>

        <PopoverContent className="p-0 w-64" side="right" align="center">
          <UserMenuContent
            user={user}
            initials={initials}
            onProfileClick={onProfileClick}
            onBookmarksClick={onBookmarksClick}
            onSettingsClick={onSettingsClick}
            onLogoutClick={onLogoutClick}
            onUserInfoClick={onUserInfoClick}
            onClose={() => onOpenChange(false)}
            isMobile={false}
          />
        </PopoverContent>
      </Popover>

      <LogoutConfirmDialog
        open={isLogoutOpen}
        onOpenChange={onLogoutOpenChange}
        onConfirm={onLogoutConfirm}
      />
    </>
  );
}
