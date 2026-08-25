"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarActionButton } from "@/components/SidebarActionButton";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { DisplayName } from "@/components/users/DisplayName";
import type { components } from "@/lib/api/api";
import type { AccountEntry } from "@/atoms/accounts";
import {
  MoreHorizontal,
  Users,
  LogOut,
  Check,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type UserType = components["schemas"]["User"];

const MAX_DISPLAYED = 9;

interface DesktopUserMenuProps {
  user: UserType;
  initials: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLogoutOpen: boolean;
  onLogoutOpenChange: (open: boolean) => void;
  onLogoutClick: () => void;
  onLogoutConfirm: () => Promise<void>;
  isExpanded?: boolean;
  canAnimate?: boolean;
  accounts?: AccountEntry[];
  onAccountClick?: (account: AccountEntry) => void;
  onAddAccount?: () => void;
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
  isExpanded = false,
  canAnimate = true,
  accounts = [],
  onAccountClick,
  onAddAccount,
}: DesktopUserMenuProps) {
  const t = useTranslations();
  const tNav = useTranslations("nav");

  const handleLogoutClick = () => {
    onOpenChange(false);
    onLogoutClick();
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
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
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Users className="h-4 w-4" />
                {t("userMenu.switchAccount")}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                  {accounts.map((account) => {
                    const isActive = account.userId === user.id;
                    const accountInitials =
                      (account.displayName?.[0] || account.username[0]).toUpperCase();

                    return (
                      <DropdownMenuItem
                        key={account.userId}
                        onClick={() => !isActive && onAccountClick?.(account)}
                        disabled={isActive}
                        className="gap-2"
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage
                            src={account.avatarUrl ?? undefined}
                            alt={account.displayName || account.username}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {accountInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate">
                            {account.displayName || `@${account.username}`}
                          </span>
                          {account.displayName && (
                            <span className="text-xs text-muted-foreground truncate">
                              @{account.username}
                            </span>
                          )}
                        </div>
                        {isActive ? (
                          <Check className="h-4 w-4 text-c-1 shrink-0" />
                        ) : account.cachedUnreadCount > 0 ? (
                          <span
                            role="status"
                            className={cn(
                              "flex h-4 min-w-4 items-center justify-center",
                              "rounded-full bg-c-1 px-1 text-[9px] leading-none font-semibold text-c-foreground shrink-0"
                            )}
                          >
                            {account.cachedUnreadCount > MAX_DISPLAYED
                              ? `${MAX_DISPLAYED}+`
                              : account.cachedUnreadCount}
                          </span>
                        ) : null}
                      </DropdownMenuItem>
                    );
                  })}
                  {accounts.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={onAddAccount}>
                    <Plus className="h-4 w-4" />
                    {t("accountSwitcher.addAccount")}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogoutClick}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      <LogoutConfirmDialog
        open={isLogoutOpen}
        onOpenChange={onLogoutOpenChange}
        onConfirm={onLogoutConfirm}
      />
    </>
  );
}
