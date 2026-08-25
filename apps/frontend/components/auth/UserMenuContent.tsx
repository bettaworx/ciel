"use client";

import { useTranslations } from "next-intl";
import {
  User,
  Users,
  Settings as SettingsIcon,
  Bookmark,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import type { components } from "@/lib/api/api";

type UserType = components["schemas"]["User"];

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DisplayName } from "@/components/users/DisplayName";
import { UnreadDot } from "./UnreadDot";
import { cn } from "@/lib/utils";

interface UserMenuContentProps {
  user: UserType;
  initials: string;
  onProfileClick: () => void;
  onBookmarksClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  onUserInfoClick?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  onSwitchAccountClick?: () => void;
  /** Marks the row when another signed-in account has notifications waiting. */
  hasOtherUnread?: boolean;
}

export function UserMenuContent({
  user,
  initials,
  onProfileClick,
  onBookmarksClick,
  onSettingsClick,
  onLogoutClick,
  onUserInfoClick,
  onClose,
  isMobile = false,
  onSwitchAccountClick,
  hasOtherUnread = false,
}: UserMenuContentProps) {
  const t = useTranslations();

  return (
    <div className={cn("w-full", isMobile ? "w-full" : "w-64")}>
      {/* ====== メイン画面 ====== */}
      <div data-view="main" className="w-full relative">
        {/* ユーザー情報ヘッダー */}
        <div
          className={cn(
            "flex flex-col items-center gap-2 p-4 transition-colors relative",
            onUserInfoClick && "cursor-pointer",
          )}
          onClick={onUserInfoClick}
        >
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={user.avatarUrl ?? undefined}
              alt={user.displayName || user.username}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            {user.displayName ? (
              <>
                <div className="text-sm font-semibold">
                  <DisplayName
                    name={user.displayName}
                    isPrivate={user.isPrivate}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  @{user.username}
                </div>
              </>
            ) : (
              <div className="font-semibold">
                @{user.username}
              </div>
            )}
          </div>

          {/* Xボタン（デスクトップのみ） */}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              rounded="md"
              className="absolute top-1.5 right-2 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label={t("userMenu.closeMenu")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* メニュー項目 */}
        {/* プロフィールと設定はデスクトップではサイドバーに常設されているので、
            メニューにはモバイルでのみ出す（PCではこのセクション自体を非表示） */}
        {isMobile && (
          <>
            <Separator />
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                rounded="md"
                className="w-full justify-start"
                onClick={onProfileClick}
              >
                <User className="h-4 w-4" />
                {t("userMenu.viewProfile")}
              </Button>

              <Button
                variant="ghost"
                rounded="md"
                className="w-full justify-start"
                onClick={onBookmarksClick}
              >
                <Bookmark className="h-4 w-4" />
                {t("nav.bookmarks")}
              </Button>

              <Button
                variant="ghost"
                rounded="md"
                className="w-full justify-start"
                onClick={onSettingsClick}
              >
                <SettingsIcon className="h-4 w-4" />
                {t("settings.title")}
              </Button>
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-1 p-2">
          {isMobile && onSwitchAccountClick && (
            <Button
              variant="ghost"
              rounded="md"
              className="w-full justify-between"
              onClick={onSwitchAccountClick}
            >
              <span className="flex items-center gap-2">
                <span className="relative flex">
                  <Users className="h-4 w-4" />
                  {hasOtherUnread && <UnreadDot className="-right-1 -top-1 h-1.5 w-1.5" />}
                </span>
                {t("userMenu.switchAccount")}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            rounded="md"
            className="w-full justify-start !text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 [&>svg]:!text-destructive"
            onClick={onLogoutClick}
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
