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
import { UnreadDot } from "./UnreadDot";
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
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);

  const hasOtherUnread = accounts.some(
    (account) => account.userId !== user.id && account.cachedUnreadCount > 0,
  );

  // The account list is a sheet of its own, stacked on top of this one rather
  // than replacing it: closing it puts the user back where they were instead of
  // dumping them on the page.
  const handleSwitchAccountClick = () => {
    setIsAccountsOpen(true);
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            className="relative w-12 h-12 rounded-full p-0 hover:bg-transparent"
            aria-label={t("nav.openUserMenu")}
          >
            <Avatar className="w-10 h-10 rounded-xl">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName || user.username} />
              <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {hasOtherUnread && <UnreadDot className="right-0.5 top-0.5" />}
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
            onSwitchAccountClick={handleSwitchAccountClick}
            hasOtherUnread={hasOtherUnread}
          />

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="default">{t("common.close")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <DrawerContent>
          <AccountSwitcherContent
            accounts={accounts}
            activeUserId={user.id}
            onAccountClick={(account) => {
              setIsAccountsOpen(false);
              onAccountClick?.(account);
            }}
            onAddAccount={() => {
              setIsAccountsOpen(false);
              onAddAccount?.();
            }}
          />

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="default">{t("common.close")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
