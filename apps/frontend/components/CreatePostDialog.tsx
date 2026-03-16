"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Image as ImageIcon, User as UserIcon } from "lucide-react";
import { useAtomValue } from "jotai";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { userAtom } from "@/atoms/auth";
import { useComposePost } from "./post-composer/useComposePost";
import { CharacterCounter } from "./post-composer/CharacterCounter";
import { MAX_CONTENT_LENGTH } from "./post-composer/constants";
import { ImageLightbox } from "@/components/ImageLightbox";
import { PostMediaPreview } from "@/components/PostMediaPreview";
import { OgpCard } from "@/components/OgpCard";

// Types
interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create Post Dialog Component
 *
 * Features:
 * - Text input with auto-resize (max 400px desktop, 50vh mobile)
 * - Image upload with blob URL preview (max 4 images)
 * - Video upload with blob URL preview (max 1 video)
 * - Character counter with progress ring
 * - Ctrl/Cmd + Enter to post
 * - Responsive layout (600px desktop, full-width mobile with margins)
 */
export function CreatePostDialog({
  open,
  onOpenChange,
}: CreatePostDialogProps) {
  const t = useTranslations();
  const user = useAtomValue(userAtom);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Use shared composition logic
  const {
    content,
    images,
    isUploading,
    isDragging,
    ogpUrl,
    previewMedia,
    fileInputRef,
    textareaRef,
    handleContentChange,
    handleKeyDown,
    handlePaste,
    handleImageSelect,
    handleRemoveMedia,
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
    onSuccess: () => onOpenChange(false),
  });

  const handleOpenChange = (newOpen: boolean) => {
    // Don't allow closing while posting
    if (!newOpen && (createPostMutation.isPending || isUploading)) {
      return;
    }
    onOpenChange(newOpen);
  };

  const handleLightboxOpen = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="
        sm:max-w-[600px]
        gap-0
        p-0
        [&>button]:hidden
        sm:!top-6
        sm:!translate-y-0
        sm:m-6
        max-sm:!m-3
        max-sm:!top-0
        max-sm:!left-0
        max-sm:!right-0
        max-sm:!translate-x-0
        max-sm:!translate-y-0
        max-sm:!max-w-[calc(100vw-24px)]
        max-sm:!w-[calc(100vw-24px)]
        max-sm:rounded-xl
        max-sm:!max-h-[calc(100vh-24px)]
        max-sm:overflow-hidden
        z-[60]
      "
      >
        {/* Drag & Drop Overlay */}
        {isDragging && !isDropDisabled && (
          <div className="absolute inset-0 z-10 bg-background/90 border-2 border-dashed border-c-1 rounded-xl flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-c-1" />
              <p className="text-lg font-medium text-foreground">
                {t("createPost.dropMedia")}
              </p>
            </div>
          </div>
        )}

        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">{t("createPost.title")}</DialogTitle>

        {/* Header */}
        <div className="p-3 flex flex-row items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            disabled={createPostMutation.isPending || isUploading}
            aria-label={t("common.close")}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>

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
              className="h-8 px-4"
            >
              {createPostMutation.isPending
                ? t("createPost.posting")
                : t("createPost.post")}
            </Button>
          </div>
        </div>

        {/* Content - Scrollable container */}
        <div className="overflow-y-auto max-sm:max-h-[calc(100vh-4rem)]">
          {/* Avatar + Textarea */}
          <div className="pt-0 p-3 flex gap-3">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
              {user?.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.username} />
              ) : (
                <AvatarFallback>
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </AvatarFallback>
              )}
            </Avatar>

            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={t("createPost.placeholder")}
              className="mt-1.5 md:mt-0.75 flex-1 min-h-[100px] max-h-[400px] max-sm:max-h-[50vh] resize-none text-base md:text-lg bg-transparent hover:bg-transparent border-none outline-none ring-0 focus-visible:ring-0 px-0 py-0 overflow-y-auto rounded-none"
              maxLength={MAX_CONTENT_LENGTH}
              disabled={createPostMutation.isPending || isUploading}
            />
          </div>

          {/* OGP Link Preview – only when no media is attached */}
          {ogpUrl && (
            <div className="px-3 pb-3">
              <OgpCard url={ogpUrl} />
            </div>
          )}

          {/* Media Preview (images / video) */}
          {previewMedia.length > 0 && (
            <div className="px-3 pb-3">
              <PostMediaPreview
                media={previewMedia}
                editable
                onRemove={handleRemoveMedia}
                onLightboxOpen={handleLightboxOpen}
              />
            </div>
          )}

          {/* Actions */}
          <div className="px-3 pb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={isDropDisabled}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDropDisabled}
              aria-label={t("createPost.uploadMedia")}
              className="h-8 w-8"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
      <ImageLightbox
        images={images.map((img) => ({ src: img.previewUrl, alt: "" }))}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
    </Dialog>
  );
}
