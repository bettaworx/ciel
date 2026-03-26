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
import { useTranslations } from "next-intl";

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
  /** ピン止め時のホバーカラー制御用 */
  isPinned?: boolean;
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
}: DesktopUserMenuProps) {
  const tNav = useTranslations("nav");
  const hoverBg = "hover:bg-sidebar-hover";

  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <SidebarActionButton
            icon={
              <Avatar className="w-12 h-12 shrink-0">
                {user.avatarUrl && (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                  />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            }
            label={
              <MfmRenderer
                text={user.displayName || user.username}
                allowList={DISPLAY_NAME_ALLOW_LIST}
              />
            }
            subLabel={`@${user.username}`}
            isExpanded={isExpanded}
            hoverBg={hoverBg}
            className={isExpanded ? "w-full min-w-[232px]" : undefined}
            aria-label={tNav("openUserMenu")}
            iconPaddingClassName="h-[64px] w-[64px] flex items-center justify-center"
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
