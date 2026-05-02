"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Bold,
  Italic,
  Type,
  ALargeSmall,
  CodeXml,
  Link,
  AlignHorizontalSpaceAround,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PostMediaPreview } from "@/components/PostMediaPreview";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import { OgpCard } from "@/components/OgpCard";
import { cn } from "@/lib/utils";
import { CharacterCounter } from "./CharacterCounter";
import { EmojiAutocomplete } from "./EmojiAutocomplete";
import { MediaUploadButton } from "./MediaUploadButton";
import { TextFormatButton } from "./TextFormatButton";
import { FontFormatButton } from "./FontFormatButton";
import { CodeFormatButton } from "./CodeFormatButton";
import { SizeFormatButton } from "./SizeFormatButton";
import { LinkFormatButton } from "./LinkFormatButton";
import { FormatOverflowMenu } from "./FormatOverflowMenu";
import { insertCenterDecoration } from "./centerDecoration";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from "./constants";
import type { UseComposePostReturn } from "./useComposePost";
import { useComposerPlaceholder } from "./useComposerPlaceholder";

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
  /** Reuse a parent-selected placeholder so collapsed and expanded card states match. */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Layout-specific style tokens
// ---------------------------------------------------------------------------

const styles = {
  card: {
    /** Padding that aligns content under the textarea (past the avatar) */
    contentPadding: "pl-15 px-0",
    /** Upload / format button size */
    toolbarButton: "h-9 w-9",
    toolbarIcon: "w-5 h-5",
    /** Post button height */
    postButton: "h-9 px-4",
  },
  dialog: {
    contentPadding: "pl-18 px-3",
    toolbarButton: "h-9 w-9",
    toolbarIcon: "w-5 h-5",
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
  placeholder: placeholderOverride,
}: PostComposerContentProps) {
  const t = useTranslations();
  const s = styles[layout];
  const [placeholderRefreshKey, setPlaceholderRefreshKey] = useState(0);
  const hadTypedContentRef = useRef(false);
  const generatedPlaceholder = useComposerPlaceholder(placeholderRefreshKey);
  const placeholder = placeholderOverride ?? generatedPlaceholder;

  // ---------------------------------------------------------------------------
  // Destructure `compose` so that the React Compiler / eslint can distinguish
  // ref values (fileInputRef, textareaRef) from regular state & handlers.
  // Without this, accessing *any* property of `compose` during render is
  // flagged as "Cannot access refs during render" (react-hooks/refs).
  // ---------------------------------------------------------------------------
  const {
    // Refs — only used as JSX `ref` props or inside callbacks, never read .current during render
    imageFileInputRef,
    videoFileInputRef,
    textareaRef,
    // State setters
    setContent,
    setSelectionRange,
    // State
    content,
    isUploading,
    isDragging,
    ogpUrl,
    previewMedia,
    selectionRange,
    // Computed
    maxContentLength,
    contentLength,
    contentPercentage,
    showCharacterCount,
    canPost,
    isDropDisabled,
    isImageUploadDisabled,
    isVideoUploadDisabled,
    cropDialogOpen,
    cropImageSrc,
    pendingCropImage,
    cropDialogZIndexClass,
    // Handlers
    handleContentChange,
    handleKeyDown,
    handleImageSelect,
    handlePaste,
    handleRemoveMedia,
    handleCropOpen,
    handleCropDialogOpenChange,
    handleCropComplete,
    handlePost,
    // Mutations
    createPostMutation,
  } = compose;

  useEffect(() => {
    if (placeholderOverride !== undefined) {
      return;
    }

    if (content.length === 0) {
      if (hadTypedContentRef.current) {
        hadTypedContentRef.current = false;
        setPlaceholderRefreshKey((key) => key + 1);
      }
      return;
    }

    hadTypedContentRef.current = true;
  }, [content, placeholderOverride]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    let frame = 0;
    const syncSelectionRange = () => {
      frame = 0;
      const nextSelectionRange = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      };

      setSelectionRange((current) =>
        current.start === nextSelectionRange.start &&
        current.end === nextSelectionRange.end
          ? current
          : nextSelectionRange,
      );
    };

    const requestSyncSelectionRange = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(syncSelectionRange);
    };

    requestSyncSelectionRange();

    textarea.addEventListener("input", requestSyncSelectionRange);
    textarea.addEventListener("select", requestSyncSelectionRange);
    textarea.addEventListener("keyup", requestSyncSelectionRange);
    textarea.addEventListener("mouseup", requestSyncSelectionRange);
    textarea.addEventListener("click", requestSyncSelectionRange);
    textarea.addEventListener("focus", requestSyncSelectionRange);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      textarea.removeEventListener("input", requestSyncSelectionRange);
      textarea.removeEventListener("select", requestSyncSelectionRange);
      textarea.removeEventListener("keyup", requestSyncSelectionRange);
      textarea.removeEventListener("mouseup", requestSyncSelectionRange);
      textarea.removeEventListener("click", requestSyncSelectionRange);
      textarea.removeEventListener("focus", requestSyncSelectionRange);
    };
  }, [textareaRef, setSelectionRange]);

  // ---- Shared sub-sections ------------------------------------------------

  /** Character counter + Post button group */
  const counterAndPost = (
    <div className="flex items-center gap-3">
      <CharacterCounter
        current={contentLength}
        max={maxContentLength}
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

  /** Upload buttons — separate for images and video */
  const uploadButtons = (
    <div className="flex items-center gap-1">
      <MediaUploadButton
        inputRef={imageFileInputRef}
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        disabled={isImageUploadDisabled}
        onChange={handleImageSelect}
        icon={ImageIcon}
        ariaLabel={t("createPost.uploadImage")}
        className={s.toolbarButton}
        iconClassName={s.toolbarIcon}
      />
      <MediaUploadButton
        inputRef={videoFileInputRef}
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        disabled={isVideoUploadDisabled}
        onChange={handleImageSelect}
        icon={VideoIcon}
        ariaLabel={t("createPost.uploadVideo")}
        className={s.toolbarButton}
        iconClassName={s.toolbarIcon}
      />
    </div>
  );

  /** Text formatting buttons — order: Bold, Italic, Font, Size, Code, URL, Center */
  const formatButtons = (
    <div className="flex items-center gap-1">
      {/* Bold, Italic — always visible */}
      <TextFormatButton
        icon={Bold}
        prefix="<b>"
        suffix="</b>"
        textareaRef={textareaRef}
        setContent={setContent}
        content={content}
        selectionRange={selectionRange}
        setSelectionRange={setSelectionRange}
        ariaLabel={t("createPost.formatBold")}
        className={s.toolbarButton}
        iconClassName={s.toolbarIcon}
      />
      <TextFormatButton
        icon={Italic}
        prefix="<i>"
        suffix="</i>"
        textareaRef={textareaRef}
        setContent={setContent}
        content={content}
        selectionRange={selectionRange}
        setSelectionRange={setSelectionRange}
        ariaLabel={t("createPost.formatItalic")}
        className={s.toolbarButton}
        iconClassName={s.toolbarIcon}
      />

      {/* Font, Size — always visible in dialog; desktop-only in card */}
      <FontFormatButton
        icon={Type}
        textareaRef={textareaRef}
        setContent={setContent}
        content={content}
        selectionRange={selectionRange}
        setSelectionRange={setSelectionRange}
        ariaLabel={t("createPost.formatFont")}
        className={cn(s.toolbarButton, layout === "card" && "max-sm:hidden")}
        iconClassName={s.toolbarIcon}
      />
      <SizeFormatButton
        icon={ALargeSmall}
        textareaRef={textareaRef}
        setContent={setContent}
        content={content}
        selectionRange={selectionRange}
        setSelectionRange={setSelectionRange}
        ariaLabel={t("createPost.formatSize")}
        className={cn(s.toolbarButton, layout === "card" && "max-sm:hidden")}
        iconClassName={s.toolbarIcon}
      />

      {/* Code, Link, Center:
          - card layout: always in overflow menu
          - dialog layout desktop: direct buttons
          - dialog layout mobile: in overflow menu (without Font/Size) */}
      {layout === "dialog" && (
        <>
          <CodeFormatButton
            icon={CodeXml}
            textareaRef={textareaRef}
            setContent={setContent}
            content={content}
            selectionRange={selectionRange}
            setSelectionRange={setSelectionRange}
            ariaLabel={t("createPost.formatCode")}
            className={cn(s.toolbarButton, "max-sm:hidden")}
            iconClassName={s.toolbarIcon}
          />
          <LinkFormatButton
            icon={Link}
            textareaRef={textareaRef}
            setContent={setContent}
            content={content}
            selectionRange={selectionRange}
            setSelectionRange={setSelectionRange}
            ariaLabel={t("createPost.formatLink")}
            className={cn(s.toolbarButton, "max-sm:hidden")}
            iconClassName={s.toolbarIcon}
          />
          <TextFormatButton
            icon={AlignHorizontalSpaceAround}
            prefix="<center>"
            suffix="</center>"
            textareaRef={textareaRef}
            setContent={setContent}
            content={content}
            selectionRange={selectionRange}
            setSelectionRange={setSelectionRange}
            ariaLabel={t("createPost.formatCenter")}
            className={cn(s.toolbarButton, "max-sm:hidden")}
            iconClassName={s.toolbarIcon}
            onInsert={insertCenterDecoration}
          />
        </>
      )}
      {/* Overflow menu: card always, dialog mobile only (Code/Link/Center only) */}
      <FormatOverflowMenu
        textareaRef={textareaRef}
        setContent={setContent}
        content={content}
        selectionRange={selectionRange}
        setSelectionRange={setSelectionRange}
        includeFontSize={layout === "card"}
        className={cn(s.toolbarButton, layout === "dialog" && "sm:hidden")}
        iconClassName={s.toolbarIcon}
      />
    </div>
  );

  /** Avatar + Textarea row */
  const textareaRow = (
    <div className={cn("relative flex gap-3", layout === "dialog" && "pt-0 p-3")}>
      {avatar}
      <Textarea
        ref={textareaRef}
        rows={1}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`flex-1 max-h-[400px] mt-2.25 md:mt-2 max-sm:max-h-[50vh] resize-none text-base md:text-lg bg-transparent hover:bg-transparent border-none outline-none ring-0 focus-visible:ring-0 px-0 py-0 overflow-y-auto rounded-none min-h-0`}
        maxLength={maxContentLength}
        disabled={createPostMutation.isPending || isUploading}
      />
      <EmojiAutocomplete
        textareaRef={textareaRef}
        value={content}
        setValue={setContent}
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
          onCrop={handleCropOpen}
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

          {/* Upload & format buttons */}
          <div className="px-3 pb-3 flex items-center justify-between">
            {uploadButtons}
            {formatButtons}
          </div>
        </div>

        {cropDialogOpen && cropImageSrc && pendingCropImage && (
          <ImageCropDialog
            open={cropDialogOpen}
            onOpenChange={handleCropDialogOpenChange}
            imageSrc={cropImageSrc}
            title={t("createPost.cropTitle")}
            originalFile={pendingCropImage.originalFile}
            initialCrop={pendingCropImage.crop}
            contentClassName={cropDialogZIndexClass}
            overlayClassName="z-[65]"
            onCropComplete={handleCropComplete}
          />
        )}
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
          <div>{uploadButtons}</div>
          <div className="flex flex-row gap-3">
            {formatButtons}
            {counterAndPost}
          </div>
        </div>
      </div>

      {cropDialogOpen && cropImageSrc && pendingCropImage && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={handleCropDialogOpenChange}
          imageSrc={cropImageSrc}
          aspect={1}
          title={t("createPost.cropTitle")}
          originalFile={pendingCropImage.originalFile}
          initialCrop={pendingCropImage.crop}
          contentClassName={cropDialogZIndexClass}
          overlayClassName="z-[65]"
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
