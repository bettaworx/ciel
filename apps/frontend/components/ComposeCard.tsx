"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Image as ImageIcon, User as UserIcon } from "lucide-react";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { userAtom } from "@/atoms/auth";
import { useComposePost } from "./post-composer/useComposePost";
import { CharacterCounter } from "./post-composer/CharacterCounter";
import { ImagePreview } from "./post-composer/ImagePreview";
import { MAX_CONTENT_LENGTH, MAX_IMAGES } from "./post-composer/constants";
import { useUserMenu } from "@/lib/hooks/use-user-menu";
import { UserMenuContent } from "@/components/auth/UserMenuContent";
import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";
import { ImageLightbox } from "@/components/ImageLightbox";

/**
 * Inline compose card for creating posts
 * Shows compact input when collapsed, full composer when expanded
 */
export function ComposeCard() {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const user = useAtomValue(userAtom);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
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
  const {
    content,
    images,
    isUploading,
    isDragging,
    fileInputRef,
    textareaRef,
    handleContentChange,
    handleKeyDown,
    handlePaste,
    handleImageSelect,
    handleRemoveImage,
    handlePost,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    contentLength,
    contentPercentage,
    showCharacterCount,
    canPost,
    isDropDisabled,
    createPostMutation,
  } = useComposePost({
    onSuccess: () => {
      setIsExpanded(false); // Collapse after successful post
    },
  });

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
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
      // Note: We check content.length, not trim().length, as per user request
      // (spaces-only input should NOT be considered empty)
      if (content.length === 0 && images.length === 0) {
        setIsExpanded(false);
      }
    }, 200);
  };

  if (!user) return null;

  const initials = (user.displayName?.[0] || user.username[0]).toUpperCase();
  const lightboxImages = images.map((image) => ({
    src: image.previewUrl,
    alt: "",
  }));

  return (
    <>
      <div
        ref={composeCardRef}
        className="bg-card rounded-xl sm:rounded-2xl p-3 relative"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag & Drop Overlay (only when expanded) */}
        {isExpanded && isDragging && !isDropDisabled && (
          <div className="absolute inset-0 z-10 bg-background/90 border-2 border-dashed border-c-1 rounded-xl flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-c-1" />
              <p className="text-lg font-medium text-foreground">
                {t("createPost.dropImages")}
              </p>
            </div>
          </div>
        )}

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
          <div className="space-y-3">
            {/* Avatar + Textarea */}
            <div className="flex gap-3">
              <Popover open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
                <PopoverTrigger asChild>
                  <button
                    onMouseDown={(e) => {
                      // Prevent focus change when clicking avatar
                      // This ensures the textarea doesn't get focused when opening the menu
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

              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={handleBlur}
                placeholder={t("createPost.placeholder")}
                className="flex-1 min-h-[100px] max-h-[400px] mt-2 md:mt-3 max-sm:max-h-[50vh] resize-none text-base md:text-lg bg-transparent hover:bg-transparent border-none outline-none ring-0 focus-visible:ring-0 px-0 py-0 overflow-y-auto rounded-none"
                maxLength={MAX_CONTENT_LENGTH}
                disabled={createPostMutation.isPending || isUploading}
              />
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="pl-[52px] sm:pl-[60px]">
                <div className="flex gap-2 flex-wrap">
                  {images.map((image) => (
                    <ImagePreview
                      key={image.localId}
                      image={image}
                      onRemove={handleRemoveImage}
                      disabled={createPostMutation.isPending || isUploading}
                      onPreview={() => {
                        const index = images.findIndex(
                          (candidate) => candidate.localId === image.localId,
                        );
                        setLightboxIndex(index === -1 ? 0 : index);
                        setLightboxOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pl-[52px] sm:pl-[60px]">
              {/* Left: Image Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={
                    images.length >= MAX_IMAGES ||
                    createPostMutation.isPending ||
                    isUploading
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    images.length >= MAX_IMAGES ||
                    createPostMutation.isPending ||
                    isUploading
                  }
                  aria-label={t("createPost.uploadImage")}
                  className="h-9 w-9"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </div>

              {/* Right: Character Counter + Post Button */}
              <div className="flex items-center gap-3">
                <CharacterCounter
                  current={contentLength}
                  max={MAX_CONTENT_LENGTH}
                  percentage={contentPercentage}
                  showCount={showCharacterCount}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handlePost}
                  disabled={!canPost}
                  className="h-9 px-4"
                >
                  {createPostMutation.isPending
                    ? t("createPost.posting")
                    : t("createPost.post")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        open={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        onConfirm={handleLogoutConfirm}
      />
      <ImageLightbox
        images={lightboxImages}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
    </>
  );
}
