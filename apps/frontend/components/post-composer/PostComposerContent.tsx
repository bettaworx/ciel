"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageLightbox } from "@/components/ImageLightbox";
import { PostMediaPreview } from "@/components/PostMediaPreview";
import { OgpCard } from "@/components/OgpCard";
import { cn } from "@/lib/utils";
import { CharacterCounter } from "./CharacterCounter";
import { MAX_CONTENT_LENGTH } from "./constants";
import type { UseComposePostReturn } from "./useComposePost";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostComposerContentProps {
  /** Layout variant — controls placement of counter, post button, etc. */
  layout: "card" | "dialog";
  /** Return value of useComposePost() */
  compose: UseComposePostReturn;
  /** Avatar element — Card passes a Popover-wrapped avatar, Dialog a static one */
  avatar: ReactNode;
  /** (dialog only) Called when the close button is clicked */
  onClose?: () => void;
  /** (dialog only) Whether the close button should be disabled */
  closeDisabled?: boolean;
  /** (card only) Called when the textarea loses focus */
  onBlur?: () => void;
}

// ---------------------------------------------------------------------------
// Layout-specific style tokens
// ---------------------------------------------------------------------------

const styles = {
  card: {
    /** Padding that aligns content under the textarea (past the avatar) */
    contentPadding: "pl-15 px-0",
    /** Upload button size */
    uploadButton: "h-9 w-9",
    uploadIcon: "w-5 h-5",
    /** Post button height */
    postButton: "h-9 px-4",
  },
  dialog: {
    contentPadding: "pl-18 px-3",
    uploadButton: "h-8 w-8",
    uploadIcon: "w-4 h-4",
    postButton: "h-8 px-4",
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared post composer content.
 *
 * Renders the complete editing UI (textarea, OGP preview, media preview,
 * upload button, character counter, post button, drag overlay, lightbox).
 *
 * Layout differences between the inline card and the dialog are controlled
 * by the `layout` prop.
 */
export function PostComposerContent({
  layout,
  compose,
  avatar,
  onClose,
  closeDisabled,
  onBlur,
}: PostComposerContentProps) {
  const t = useTranslations();
  const s = styles[layout];

  // ---------------------------------------------------------------------------
  // Destructure `compose` so that the React Compiler / eslint can distinguish
  // ref values (fileInputRef, textareaRef) from regular state & handlers.
  // Without this, accessing *any* property of `compose` during render is
  // flagged as "Cannot access refs during render" (react-hooks/refs).
  // ---------------------------------------------------------------------------
  const {
    // Refs — only used as JSX `ref` props or inside callbacks, never read .current during render
    fileInputRef,
    textareaRef,
    // State
    content,
    images,
    isUploading,
    isDragging,
    ogpUrl,
    previewMedia,
    // Computed
    contentLength,
    contentPercentage,
    showCharacterCount,
    canPost,
    isDropDisabled,
    // Handlers
    handleContentChange,
    handleKeyDown,
    handleImageSelect,
    handlePaste,
    handleRemoveMedia,
    handlePost,
    // Mutations
    createPostMutation,
  } = compose;

  // Lightbox state (internal — not needed by parent)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleLightboxOpen = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = images.map((img) => ({
    src: img.previewUrl,
    alt: "",
  }));

  // ---- Shared sub-sections ------------------------------------------------

  /** Character counter + Post button group */
  const counterAndPost = (
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
        className={s.postButton}
      >
        {createPostMutation.isPending
          ? t("createPost.posting")
          : t("createPost.post")}
      </Button>
    </div>
  );

  /** Hidden file input + upload button */
  const uploadButton = (
    <>
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
        className={s.uploadButton}
      >
        <ImageIcon className={s.uploadIcon} />
      </Button>
    </>
  );

  /** Avatar + Textarea row */
  const textareaRow = (
    <div className={cn("flex gap-3", layout === "dialog" && "pt-0 p-3")}>
      {avatar}
      <Textarea
        ref={textareaRef}
        rows={1}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onBlur}
        placeholder={t("createPost.placeholder")}
        className={`flex-1 max-h-[400px] mt-2 md:mt-3 max-sm:max-h-[50vh] resize-none text-base md:text-lg bg-transparent hover:bg-transparent border-none outline-none ring-0 focus-visible:ring-0 px-0 py-0 overflow-y-auto rounded-none min-h-0`}
        maxLength={MAX_CONTENT_LENGTH}
        disabled={createPostMutation.isPending || isUploading}
      />
    </div>
  );

  /** OGP link preview */
  const ogpPreview = ogpUrl ? (
    <div className={s.contentPadding}>
      <OgpCard url={ogpUrl} />
    </div>
  ) : null;

  /** Media preview (images / video) */
  const mediaPreview =
    previewMedia.length > 0 ? (
      <div className={s.contentPadding}>
        <PostMediaPreview
          media={previewMedia}
          editable
          onRemove={handleRemoveMedia}
          onLightboxOpen={handleLightboxOpen}
        />
      </div>
    ) : null;

  /** Drag & drop overlay */
  const dragOverlay =
    isDragging && !isDropDisabled ? (
      <div className="absolute inset-0 z-10 bg-background/90 border-2 border-dashed border-c-1 rounded-xl flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-c-1" />
          <p className="text-lg font-medium text-foreground">
            {t("createPost.dropMedia")}
          </p>
        </div>
      </div>
    ) : null;

  // ---- Layout assembly ----------------------------------------------------

  if (layout === "dialog") {
    return (
      <>
        {dragOverlay}

        {/* Header: close button (left) + counter & post (right) */}
        <div className="pt-3 px-3 flex flex-row items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClose?.()}
            disabled={closeDisabled}
            aria-label={t("common.close")}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
          {counterAndPost}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-sm:max-h-[calc(100vh-4rem)]">
          <div className="min-h-[200px]">
            {textareaRow}
            {ogpPreview}
            {mediaPreview}
          </div>

          {/* Upload button only */}
          <div className="px-3 pb-3">{uploadButton}</div>
        </div>

        <ImageLightbox
          images={lightboxImages}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          initialIndex={lightboxIndex}
        />
      </>
    );
  }

  // layout === "card"
  return (
    <>
      {dragOverlay}

      <div className="space-y-3">
        <div className="min-h-[100px] space-y-3">
          {textareaRow}
          {ogpPreview}
          {mediaPreview}
        </div>

        {/* Actions bar: upload (left) + counter & post (right) */}
        <div
          className={cn("flex items-center justify-between", s.contentPadding)}
        >
          <div>{uploadButton}</div>
          {counterAndPost}
        </div>
      </div>

      <ImageLightbox
        images={lightboxImages}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
      />
    </>
  );
}
