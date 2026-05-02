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
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
import type { components } from "@/lib/api/api";
import type { Theme } from "@/atoms/theme";
import type { Locale } from "@/i18n/constants";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type User = components["schemas"]["User"];
type MenuView = "main" | "theme" | "language";

interface DesktopUserMenuProps {
  user: User;
  initials: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: MenuView;
  onViewChange: (view: MenuView) => void;
  isLogoutOpen: boolean;
  onLogoutOpenChange: (open: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  locale: Locale;
  onLanguageChange: (locale: Locale) => void;
  onLogoutClick: () => void;
  onLogoutConfirm: () => Promise<void>;
  onProfileClick: () => void;
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
  currentView,
  onViewChange,
  isLogoutOpen,
  onLogoutOpenChange,
  theme,
  onThemeChange,
  locale,
  onLanguageChange,
  onLogoutClick,
  onLogoutConfirm,
  onProfileClick,
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
                  {user.avatarUrl && (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold rounded-none">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            }
            label={
              user.displayName ? (
                <MfmRenderer
                  text={user.displayName}
                  allowList={DISPLAY_NAME_ALLOW_LIST}
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
            currentView={currentView}
            onViewChange={onViewChange}
            theme={theme}
            onThemeChange={onThemeChange}
            locale={locale}
            onLanguageChange={onLanguageChange}
            onProfileClick={onProfileClick}
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
