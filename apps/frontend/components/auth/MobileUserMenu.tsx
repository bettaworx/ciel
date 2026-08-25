"use client";

import { useState } from "react";
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
import { AccountSwitcherContent } from "./AccountSwitcher";
import type { components } from "@/lib/api/api";
import type { AccountEntry } from "@/atoms/accounts";

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
  accounts?: AccountEntry[];
  onAccountClick?: (account: AccountEntry) => void;
  onAddAccount?: () => void;
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
  accounts = [],
  onAccountClick,
  onAddAccount,
}: MobileUserMenuProps) {
  const t = useTranslations();
  const [view, setView] = useState<"main" | "accounts">("main");

  const handleSwitchAccountClick = () => {
    setView("accounts");
  };

  const handleBackToMain = () => {
    setView("main");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setView("main");
    }
    onOpenChange(open);
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
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
        {view === "main" ? (
          <UserMenuContent
            user={user}
            initials={initials}
            onProfileClick={onProfileClick}
            onBookmarksClick={onBookmarksClick}
            onSettingsClick={onSettingsClick}
            onLogoutClick={onLogoutClick}
            onUserInfoClick={onUserInfoClick}
            isMobile={true}
            onSwitchAccountClick={handleSwitchAccountClick}
          />
        ) : (
          <AccountSwitcherContent
            accounts={accounts}
            activeUserId={user.id}
            onAccountClick={(account) => {
              onAccountClick?.(account);
            }}
            onAddAccount={() => {
              onAddAccount?.();
            }}
            onBack={handleBackToMain}
          />
        )}

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="default">{t("common.close")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
