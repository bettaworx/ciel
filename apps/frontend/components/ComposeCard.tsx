"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { User as UserIcon } from "lucide-react";
import { useAtomValue } from "jotai";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { userAtom } from "@/atoms/auth";
import { useComposePost } from "./post-composer/useComposePost";
import { PostComposerContent } from "./post-composer/PostComposerContent";
import { useUserMenu } from "@/lib/hooks/use-user-menu";
import { UserMenuContent } from "@/components/auth/UserMenuContent";
import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";

/**
 * Inline compose card for creating posts
 * Shows compact input when collapsed, full composer when expanded
 */
export function ComposeCard() {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const user = useAtomValue(userAtom);
  const [isExpanded, setIsExpanded] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const composeCardRef = useRef<HTMLDivElement>(null);

  // User menu state
  const {
    menuView,
    setMenuView,
    isMenuOpen,
    isLogoutOpen,
    setIsLogoutOpen,
    theme,
    setTheme,
    locale,
    handleMenuOpenChange,
    handleLogoutClick,
    handleLogoutConfirm,
    handleLanguageChange,
    handleUserInfoClick,
    handleProfileClick,
    handleSettingsClick,
  } = useUserMenu();

  // Use shared composition logic
  const compose = useComposePost({
    onSuccess: () => {
      setIsExpanded(false); // Collapse after successful post
    },
  });

  // Destructure textareaRef so the linter recognises it as a stable ref identity
  // (accessing compose.textareaRef triggers react-hooks/exhaustive-deps)
  const { textareaRef } = compose;

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
    // textareaRef is a stable React ref — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Handle blur event - collapse if content is empty
  const handleBlur = () => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Wait 200ms before checking if we should collapse
    // This allows clicks on buttons (post, image upload, etc.) to complete
    blurTimeoutRef.current = setTimeout(() => {
      // Check if focus moved outside of ComposeCard
      const composeCard = composeCardRef.current;
      if (!composeCard) return;

      // If user menu is open, don't collapse
      if (isMenuOpen) return;

      // If focus is still within ComposeCard, don't collapse
      if (composeCard.contains(document.activeElement)) {
        return;
      }

      // Only collapse if content is empty AND no images
      if (
        compose.content.length === 0 &&
        compose.images.length === 0 &&
        !compose.video
      ) {
        setIsExpanded(false);
      }
    }, 200);
  };

  if (!user) return null;

  const initials = (user.displayName?.[0] || user.username[0]).toUpperCase();

  // Avatar wrapped in Popover for user menu
  const avatarElement = (
    <Popover open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
      <PopoverTrigger asChild>
        <button
          onMouseDown={(e) => {
            // Prevent focus change when clicking avatar
            e.preventDefault();
          }}
          className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full hover:opacity-80 transition-opacity"
          aria-label={tNav("openUserMenu")}
        >
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : (
              <AvatarFallback>
                <UserIcon className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-64" side="left" align="start">
        <UserMenuContent
          user={user}
          initials={initials}
          currentView={menuView}
          onViewChange={setMenuView}
          theme={theme}
          onThemeChange={setTheme}
          locale={locale}
          onLanguageChange={handleLanguageChange}
          onProfileClick={() => handleProfileClick(user.username)}
          onSettingsClick={handleSettingsClick}
          onLogoutClick={handleLogoutClick}
          onUserInfoClick={() => handleUserInfoClick(user.username)}
          onClose={() => handleMenuOpenChange(false)}
          isMobile={false}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <div
        ref={composeCardRef}
        className="bg-card rounded-xl sm:rounded-2xl p-3 relative"
        onDragOver={compose.handleDragOver}
        onDragEnter={compose.handleDragEnter}
        onDragLeave={compose.handleDragLeave}
        onDrop={compose.handleDrop}
      >
        {/* Collapsed State */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center gap-3 text-left group"
            aria-label={t("createPost.title")}
          >
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.username} />
              ) : (
                <AvatarFallback>
                  <UserIcon className="h-6 w-6" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 h-10 sm:h-12 rounded-lg bg-transparent transition-colors flex items-center">
              <span className="text-base md:text-lg md:mt-1 text-muted-foreground">
                {t("createPost.placeholder")}
              </span>
            </div>
          </button>
        )}

        {/* Expanded State */}
        {isExpanded && (
          <PostComposerContent
            layout="card"
            compose={compose}
            avatar={avatarElement}
            onBlur={handleBlur}
          />
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
