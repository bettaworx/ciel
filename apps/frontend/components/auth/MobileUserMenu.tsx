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

type User = components['schemas']['User'];

interface MobileUserMenuProps {
  user: User;
  initials: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLogoutClick: () => void;
  onProfileClick: () => void;
  onBookmarksClick: () => void;
  onSettingsClick: () => void;
  onUserInfoClick: () => void;
}

export function MobileUserMenu({
  user,
  initials,
  isOpen,
  onOpenChange,
  onLogoutClick,
  onProfileClick,
  onBookmarksClick,
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
          aria-label={t("nav.openUserMenu")}
        >
          <Avatar className="w-10 h-10 rounded-xl">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName || user.username} />
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
          onProfileClick={onProfileClick}
          onBookmarksClick={onBookmarksClick}
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
