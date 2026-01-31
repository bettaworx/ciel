"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserMenuContent } from "./UserMenuContent";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import type { components } from "@/lib/api/api";
import type { Theme } from "@/atoms/theme";
import type { Locale } from "@/i18n/constants";

type User = components['schemas']['User'];
type MenuView = 'main' | 'theme' | 'language';

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
}: DesktopUserMenuProps) {
  return (
    <>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-14 h-14 rounded-full p-0 hover:bg-transparent"
            aria-label="User menu"
          >
            <Avatar className="w-12 h-12">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
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
