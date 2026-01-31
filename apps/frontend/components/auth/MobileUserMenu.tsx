"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { UserMenuContent } from "./UserMenuContent";
import type { components } from "@/lib/api/api";
import type { Theme } from "@/atoms/theme";
import type { Locale } from "@/i18n/constants";

type User = components['schemas']['User'];
type MenuView = 'main' | 'theme' | 'language';

interface MobileUserMenuProps {
  user: User;
  initials: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentView: MenuView;
  onViewChange: (view: MenuView) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  locale: Locale;
  onLanguageChange: (locale: Locale) => void;
  onLogoutClick: () => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onUserInfoClick: () => void;
}

export function MobileUserMenu({
  user,
  initials,
  isOpen,
  onOpenChange,
  currentView,
  onViewChange,
  theme,
  onThemeChange,
  locale,
  onLanguageChange,
  onLogoutClick,
  onProfileClick,
  onSettingsClick,
  onUserInfoClick,
}: MobileUserMenuProps) {
  const t = useTranslations();

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className="w-12 h-12 rounded-full p-0 hover:bg-transparent"
          aria-label="User menu"
        >
          <Avatar className="w-10 h-10">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.displayName || user.username} />
            )}
            <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DrawerTrigger>

      <DrawerContent>
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
          isMobile={true}
        />

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="default">{t("common.close")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
