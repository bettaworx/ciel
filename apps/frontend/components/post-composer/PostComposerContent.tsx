"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "@/lib/i18n";
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
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MediaUploadOverflowMenu } from "./MediaUploadOverflowMenu";
import { ComposerEmojiPicker } from "./ComposerEmojiPicker";
import { insertCenterDecoration } from "./centerDecoration";
import { ACCEPTED_IMAGE_ACCEPT, ACCEPTED_VIDEO_ACCEPT } from "./constants";
import type { UseComposePostReturn } from "./useComposePost";
import { useComposerPlaceholder } from "./useComposerPlaceholder";
import { shouldShowComposerModeSwitch, type ComposerMode } from "./composerMode";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingDiscardConfirm } from "./DrawingDiscardConfirm";
import { DrawingHistoryButtons, DrawingToolButtons } from "./DrawingToolbar";
import {
  drawingDocumentBytes,
  drawingHistoryShortcut,
  formatDrawingBytes,
  readDrawingPreferences,
  redoDrawing,
  saveDrawingPreferences,
  type DrawingBrush,
  type DrawingStroke,
  type DrawingTool,
  undoDrawing,
} from "./drawing";
import { PostCard } from "@/components/PostCard";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type Drawing = components["schemas"]["Drawing"];

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
  /** Reuse a parent-selected placeholder so collapsed and expanded card states match. */
  placeholder?: string;
  /** Override the submit button label (defaults to createPost.post). */
  submitLabel?: string;
  /** Override the submitting button label (defaults to createPost.posting). */
  submittingLabel?: string;
  /** When set, renders a non-interactive embedded PostCard preview below the media area. */
  quotedPost?: Post;
  /** Drawing attached to the replied-to post, when available. */
  replyDrawing?: Drawing | null;
}

// ---------------------------------------------------------------------------
// Layout-specific style tokens
// ---------------------------------------------------------------------------

const styles = {
  card: {
    /** Padding that aligns content under the textarea (past the avatar) */
    contentPadding: "pl-15 px-0",
    /** Upload / format button size */
    toolbarButton: "h-8 w-8",
    toolbarIcon: "w-4 h-4",
    /** Post button height */
    postButton: "h-8 px-4",
    floatingContent: "z-50",
  },
  dialog: {
    contentPadding: "pl-18 px-3",
    toolbarButton: "h-8 w-8",
    toolbarIcon: "w-4 h-4",
    postButton: "h-8 px-4",
    floatingContent: "z-[70]",
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
  placeholder: placeholderOverride,
  submitLabel,
  submittingLabel,
  quotedPost,
  replyDrawing,
}: PostComposerContentProps) {
  const t = useTranslations();
  const s = styles[layout];
  const [initialDrawingPreferences] = useState(readDrawingPreferences);
  const [placeholderRefreshKey, setPlaceholderRefreshKey] = useState(0);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("pencil");
  const [drawingBrush, setDrawingBrush] = useState<DrawingBrush>(initialDrawingPreferences.brush);
  const [drawingColor, setDrawingColor] = useState(initialDrawingPreferences.color);
  const [pencilSize, setPencilSize] = useState(initialDrawingPreferences.pencilSize);
  const [eraserSize, setEraserSize] = useState(initialDrawingPreferences.eraserSize);
  const [isDrawingStroke, setIsDrawingStroke] = useState(false);
  const [discardDrawingOpen, setDiscardDrawingOpen] = useState(false);
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
    setComposerMode,
    setDrawingStrokes,
    setRedoStrokes,
    setDrawingBackground,
    // State
    content,
    composerMode,
    drawingStrokes,
    redoStrokes,
    drawingBackground,
    isUploading,
    isDragging,
    ogpUrl,
    previewMedia,
    selectionRange,
    // Computed
    maxContentLength,
    maxDrawingInputBytes,
    contentLength,
    contentPercentage,
    showCharacterCount,
    hasMedia,
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
    handleQualityChange,
    handlePost,
    handleDrawingPost,
    // Mutations
    createPostMutation,
  } = compose;

  useEffect(() => {
    saveDrawingPreferences({
      brush: drawingBrush,
      color: drawingColor,
      background: drawingBackground,
      pencilSize,
      eraserSize,
    });
  }, [drawingBrush, drawingColor, drawingBackground, pencilSize, eraserSize]);

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
    if (layout !== "dialog") {
      return;
    }

    textareaRef.current?.focus();
  }, [layout, textareaRef]);

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
        current.start === nextSelectionRange.start && current.end === nextSelectionRange.end
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

  const showModeSwitch = shouldShowComposerModeSwitch(composerMode, content, hasMedia);
  const drawingDataBytes = useMemo(
    () => drawingDocumentBytes(drawingStrokes, drawingBackground, drawingColor),
    [drawingStrokes, drawingBackground, drawingColor],
  );
  const drawingDataPercentage = (drawingDataBytes / maxDrawingInputBytes) * 100;

  const handleModeChange = (value: string) => {
    const nextMode = value as ComposerMode;
    if (nextMode === "text" && drawingStrokes.length > 0) {
      setDiscardDrawingOpen(true);
      return;
    }
    setComposerMode(nextMode);
  };

  const handleDrawingChange = (strokes: DrawingStroke[]) => {
    setDrawingStrokes(strokes);
    setRedoStrokes([]);
  };

  const handleUndo = () => {
    const next = undoDrawing(drawingStrokes, redoStrokes);
    setDrawingStrokes(next.strokes);
    setRedoStrokes(next.redo);
  };

  const handleRedo = () => {
    const next = redoDrawing(drawingStrokes, redoStrokes);
    setDrawingStrokes(next.strokes);
    setRedoStrokes(next.redo);
  };

  const handleDrawingKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    if (event.altKey) return;
    const action = drawingHistoryShortcut(
      event.key,
      event.ctrlKey || event.metaKey,
      event.shiftKey,
    );
    if (!action) return;
    event.preventDefault();
    if (createPostMutation.isPending || isUploading) return;
    if (action === "undo" && drawingStrokes.length > 0) handleUndo();
    if (action === "redo" && redoStrokes.length > 0) handleRedo();
  };

  const discardDrawing = () => {
    setDrawingStrokes([]);
    setRedoStrokes([]);
    setComposerMode("text");
  };

  const handleSubmit = async () => {
    if (composerMode === "text") {
      await handlePost();
      return;
    }
    if (await handleDrawingPost(drawingStrokes, drawingColor)) {
      setDrawingStrokes([]);
      setRedoStrokes([]);
    }
  };

  // ---- Shared sub-sections ------------------------------------------------

  const modeSwitch = (
    <Tabs value={composerMode} onValueChange={handleModeChange}>
      <TabsList className="rounded-full bg-muted p-0.5 h-8">
        <TabsTrigger
          value="text"
          aria-label={t("createPost.textMode")}
          disabled={!showModeSwitch}
          className={cn(
            "flex-none rounded-full px-0 transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] data-[state=active]:bg-c-1 data-[state=active]:text-c-foreground",
            "h-7 w-7",
          )}
        >
          <Type className="h-3.5 w-3.5" />
        </TabsTrigger>
        <TabsTrigger
          value="drawing"
          aria-label={t("createPost.drawingMode")}
          disabled={!showModeSwitch}
          className={cn(
            "flex-none rounded-full px-0 transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.96] data-[state=active]:bg-c-1 data-[state=active]:text-c-foreground",
            "h-7 w-7",
          )}
        >
          <PenLine className="h-3.5 w-3.5" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  /** Character counter + Post button group */
  const counterAndPost = (
    <div className="flex items-center gap-3">
      {modeSwitch}
      <CharacterCounter
        current={composerMode === "drawing" ? drawingDataBytes : contentLength}
        max={composerMode === "drawing" ? maxDrawingInputBytes : maxContentLength}
        percentage={composerMode === "drawing" ? drawingDataPercentage : contentPercentage}
        showCount={composerMode === "text" && showCharacterCount}
        formatValue={composerMode === "drawing" ? formatDrawingBytes : undefined}
        label={composerMode === "drawing" ? t("createPost.drawing.dataUsage") : undefined}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={
          composerMode === "drawing"
            ? drawingStrokes.length === 0 ||
              drawingDataBytes > maxDrawingInputBytes ||
              createPostMutation.isPending ||
              isUploading
            : !canPost
        }
        className={s.postButton}
      >
        {createPostMutation.isPending
          ? (submittingLabel ?? t("createPost.posting"))
          : (submitLabel ?? t("createPost.post"))}
      </Button>
    </div>
  );

  /** Upload buttons — separate for images and video */
  /** Emoji picker — shown at the head of the format area (composer-wide) */
  const emojiButton = (
    <ComposerEmojiPicker
      textareaRef={textareaRef}
      content={content}
      setContent={setContent}
      setSelectionRange={setSelectionRange}
      disabled={createPostMutation.isPending || isUploading}
      className={s.toolbarButton}
      iconClassName={s.toolbarIcon}
    />
  );

  const uploadButtons = (
    <div className="flex items-center gap-1">
      <MediaUploadButton
        inputRef={imageFileInputRef}
        accept={ACCEPTED_IMAGE_ACCEPT}
        multiple
        disabled={isImageUploadDisabled}
        onChange={handleImageSelect}
        icon={ImageIcon}
        ariaLabel={t("createPost.uploadImage")}
        className={cn(s.toolbarButton, "max-sm:hidden")}
        iconClassName={s.toolbarIcon}
      />
      <MediaUploadButton
        inputRef={videoFileInputRef}
        accept={ACCEPTED_VIDEO_ACCEPT}
        disabled={isVideoUploadDisabled}
        onChange={handleImageSelect}
        icon={VideoIcon}
        ariaLabel={t("createPost.uploadVideo")}
        className={cn(s.toolbarButton, "max-sm:hidden")}
        iconClassName={s.toolbarIcon}
      />
      <MediaUploadOverflowMenu
        imageFileInputRef={imageFileInputRef}
        videoFileInputRef={videoFileInputRef}
        isImageUploadDisabled={isImageUploadDisabled}
        isVideoUploadDisabled={isVideoUploadDisabled}
        className={cn(s.toolbarButton, "sm:hidden")}
        iconClassName={s.toolbarIcon}
      />
    </div>
  );

  /** Text formatting buttons — order: Emoji, Bold, Italic, Font, Size, Code, URL, Center */
  const formatButtons = (
    <div className="flex items-center gap-1">
      {/* Emoji at the head of the decoration area */}
      {emojiButton}
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

      {/* Font, Size — dialog only; card uses the overflow menu (mobile behavior) */}
      {layout === "dialog" && (
        <>
          <FontFormatButton
            icon={Type}
            textareaRef={textareaRef}
            setContent={setContent}
            content={content}
            selectionRange={selectionRange}
            setSelectionRange={setSelectionRange}
            ariaLabel={t("createPost.formatFont")}
            className={s.toolbarButton}
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
            className={s.toolbarButton}
            iconClassName={s.toolbarIcon}
          />
        </>
      )}

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
      {/* Overflow menu: card always (Font/Size/Code/Link/Center), dialog mobile only (Code/Link/Center) */}
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
        placeholder={placeholder}
        className={cn(
          "flex-1 max-h-[400px] mt-2.25 md:mt-2 max-sm:max-h-[50vh] resize-none text-base md:text-lg bg-transparent hover:bg-transparent border-none outline-none ring-0 focus-visible:ring-0 px-0 py-0 overflow-y-auto rounded-none min-h-0",
        )}
        maxLength={maxContentLength}
        disabled={createPostMutation.isPending || isUploading}
      />
      <EmojiAutocomplete
        textareaRef={textareaRef}
        value={content}
        setValue={setContent}
        disabled={createPostMutation.isPending || isUploading}
        contentClassName={s.floatingContent}
      />
    </div>
  );

  const drawingHistory = (
    <DrawingHistoryButtons
      canUndo={drawingStrokes.length > 0}
      canRedo={redoStrokes.length > 0}
      onUndo={handleUndo}
      onRedo={handleRedo}
      disabled={createPostMutation.isPending || isUploading}
      className={s.toolbarButton}
    />
  );

  const drawingRow = (
    <div className={cn("flex gap-3", layout === "dialog" && "p-3")}>
      {avatar}
      <div className="relative min-w-0 flex-1">
        <DrawingCanvas
          strokes={drawingStrokes}
          onChange={handleDrawingChange}
          tool={drawingTool}
          color={drawingColor}
          brush={drawingBrush}
          background={drawingBackground}
          pencilSize={pencilSize}
          eraserSize={eraserSize}
          onDrawingStateChange={setIsDrawingStroke}
          onKeyDown={handleDrawingKeyDown}
          disabled={createPostMutation.isPending || isUploading}
          ariaLabel={t("createPost.drawing.canvas")}
        />
        {!isDrawingStroke && (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-popover/70 p-0.5 text-popover-foreground shadow-sm backdrop-blur-sm">
            {drawingHistory}
          </div>
        )}
      </div>
    </div>
  );

  const drawingTools = (
    <DrawingToolButtons
      tool={drawingTool}
      onToolChange={setDrawingTool}
      color={drawingColor}
      onColorChange={setDrawingColor}
      brush={drawingBrush}
      onBrushChange={setDrawingBrush}
      background={drawingBackground}
      onBackgroundChange={setDrawingBackground}
      pencilSize={pencilSize}
      onPencilSizeChange={setPencilSize}
      eraserSize={eraserSize}
      onEraserSizeChange={setEraserSize}
      sourceDrawing={replyDrawing ?? quotedPost?.drawing}
      disabled={createPostMutation.isPending || isUploading}
      className={s.toolbarButton}
    />
  );

  /** OGP link preview */
  const ogpPreview = ogpUrl ? (
    <div className={s.contentPadding}>
      <OgpCard url={ogpUrl} variant="timeline" />
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
          onQualityChange={handleQualityChange}
        />
      </div>
    ) : null;

  /** Quoted post preview (non-interactive) */
  const quotedPostPreview = quotedPost ? (
    <div className={layout === "dialog" ? "mb-3 pr-3 pl-18" : "pr-0 pl-15"}>
      <div className="pointer-events-none select-none">
        <PostCard post={quotedPost} variant="embedded" isLast />
      </div>
    </div>
  ) : null;

  /** Drag & drop overlay */
  const dragOverlay =
    composerMode === "text" && isDragging && !isDropDisabled ? (
      <div className="absolute inset-0 z-10 bg-background/90 border-2 border-dashed border-c-1 rounded-xl flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-c-1" />
          <p className="text-lg font-medium text-foreground">{t("createPost.dropMedia")}</p>
        </div>
      </div>
    ) : null;

  const discardConfirm = (
    <DrawingDiscardConfirm
      open={discardDrawingOpen}
      onOpenChange={setDiscardDrawingOpen}
      onConfirm={discardDrawing}
    />
  );

  // ---- Layout assembly ----------------------------------------------------

  if (layout === "dialog") {
    return (
      <>
        {dragOverlay}

        {/* Header: close (left) + mode, counter & post (right) */}
        <div className="pt-3 px-3 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
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
          </div>
          {counterAndPost}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-sm:max-h-[calc(100vh-4rem)]">
          <div className={cn(!quotedPost && "min-h-[200px]")}>
            {composerMode === "drawing" ? drawingRow : textareaRow}
            {composerMode === "text" && ogpPreview}
            {composerMode === "text" && mediaPreview}
            {quotedPostPreview}
          </div>

          {/* Upload & format buttons */}
          <div className="px-3 pb-3 flex items-center justify-between">
            {composerMode === "drawing" ? drawingTools : uploadButtons}
            {composerMode === "text" && formatButtons}
          </div>
        </div>

        {discardConfirm}

        {cropDialogOpen && cropImageSrc && pendingCropImage && (
          <ImageCropDialog
            open={cropDialogOpen}
            onOpenChange={handleCropDialogOpenChange}
            imageSrc={cropImageSrc}
            aspectMode={{ mode: "selectable", defaultId: "free" }}
            title={t("createPost.cropTitle")}
            originalFile={pendingCropImage.originalFile}
            initialCrop={pendingCropImage.crop}
            initialTransform={pendingCropImage.cropTransform}
            initialAspectId={pendingCropImage.cropAspectId}
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
          {composerMode === "drawing" ? drawingRow : textareaRow}
          {composerMode === "text" && ogpPreview}
          {composerMode === "text" && mediaPreview}
          {quotedPostPreview}
        </div>

        {/* Actions bar: upload + format (left) + counter & post (right) */}
        <div className={cn("flex items-center justify-between", s.contentPadding)}>
          <div className="flex items-center gap-1">
            {composerMode === "drawing" ? (
              drawingTools
            ) : (
              <>
                {uploadButtons}
                <Separator orientation="vertical" className="h-5 mx-1 w-[2px] rounded-full" />
                {formatButtons}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">{counterAndPost}</div>
        </div>
      </div>

      {discardConfirm}

      {cropDialogOpen && cropImageSrc && pendingCropImage && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={handleCropDialogOpenChange}
          imageSrc={cropImageSrc}
          aspectMode={{ mode: "selectable", defaultId: "free" }}
          title={t("createPost.cropTitle")}
          originalFile={pendingCropImage.originalFile}
          initialCrop={pendingCropImage.crop}
          initialTransform={pendingCropImage.cropTransform}
          initialAspectId={pendingCropImage.cropAspectId}
          contentClassName={cropDialogZIndexClass}
          overlayClassName="z-[65]"
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
