"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatePost,
  useUploadDrawing,
  useUploadMedia,
  useMediaLimits,
  useServerConfig,
  queryKeys,
} from "@/lib/hooks/use-queries";
import { ApiHttpError } from "@/lib/api/client";
import { extractFirstUrl } from "@/lib/ogp/extract-url";
import type { components } from "@/lib/api/api";
import type {
  LocalImage,
  LocalMedia,
  LocalVideo,
  PreviewMediaItem,
  TextSelectionRange,
} from "./types";
import {
  MAX_MEDIA,
  MAX_TEXTAREA_HEIGHT,
  CHARACTER_COUNT_THRESHOLD,
  MAX_RAW_IMAGE_BYTES,
  MAX_RAW_VIDEO_BYTES,
} from "./constants";
import {
  MediaNormalizeError,
  canUploadUntouched,
  isGifFile,
  isImageFile,
  isVideoFile,
  normalizeForUpload,
} from "@/lib/media/normalize";
import { loadQualityMode, saveQualityMode } from "@/lib/media/quality-preference";
import type { VideoQualityMode } from "@/lib/media/normalize";
import type { QualityMode } from "./MediaQualityPicker";
import type { ComposerMode } from "./composerMode";
import {
  createDrawingUpload,
  FALLBACK_MAX_DRAWING_INPUT_BYTES,
  FALLBACK_MAX_DRAWING_POINTS,
  FALLBACK_MAX_DRAWING_STROKES,
  readDrawingPreferences,
  type DrawingStroke,
} from "./drawing";

/** Dot-by-dot keeps original pixels, which only means something for a still. */
const isVideoMode = (mode: QualityMode): mode is VideoQualityMode => mode !== "dot-by-dot";

import type { Crop } from "react-image-crop";
import type { AspectRatioId } from "@/components/shared/image-crop/aspectRatios";
import type { Transform } from "@/components/shared/image-crop/transforms";

/** Debounce delay (ms) for OGP URL extraction from content. */
const OGP_DEBOUNCE_MS = 400;

interface UseComposePostOptions {
  onSuccess?: () => void;
  autoResize?: boolean;
  /**
   * When set, the created post will be a reply to this parent post.
   * On success, the parent post and its replies queries are also invalidated
   * so that replyCount and the reply list refresh.
   */
  parentId?: string;
  /**
   * String prepended to the textarea content at submission time only — never
   * shown in the editor. Used to attach an `@author ` mention to replies
   * without surfacing it as editable text.
   */
  contentPrefix?: string;
  /**
   * When set, the created post quotes (references) the given post.
   * Content is required for quote posts (empty content = boost).
   */
  referenceId?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Load an image blob URL and return its natural dimensions.
 */
function getImageDimensions(blobUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = blobUrl;
  });
}

/**
 * Load a video blob URL and return its native dimensions and duration.
 */
function getVideoMetadata(
  blobUrl: string,
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      resolve({ width: vid.videoWidth, height: vid.videoHeight, duration: vid.duration });
      // Clean up to release the blob reference held by the video element
      vid.src = "";
      vid.load();
    };
    vid.onerror = reject;
    vid.src = blobUrl;
  });
}

/** Release the blob: URLs an attachment holds. */
function revokeLocalMedia(item: LocalMedia) {
  if (item.type === "video") {
    URL.revokeObjectURL(item.previewUrl);
    return;
  }
  URL.revokeObjectURL(item.originalPreviewUrl);
  if (item.croppedPreviewUrl) URL.revokeObjectURL(item.croppedPreviewUrl);
}

function findImage(media: LocalMedia[], localId: string): LocalImage | undefined {
  return media.find((m): m is LocalImage => m.type === "image" && m.localId === localId);
}

/**
 * Custom hook for post composition logic
 * Handles state management, file processing, and post submission
 *
 * Media rules:
 * - A post carries up to MAX_MEDIA attachments, images and videos in any mix,
 *   kept in the order they were added.
 * - All local files use URL.createObjectURL for preview (blob: URLs).
 * - Video size limit is separate from image size limit (fetched from server).
 */
export function useComposePost(options: UseComposePostOptions = {}) {
  const { onSuccess, autoResize = true, parentId, contentPrefix, referenceId } = options;
  const t = useTranslations();
  const mediaLimits = useMediaLimits();
  const { data: serverConfig } = useServerConfig();
  const queryClient = useQueryClient();

  // State
  const [content, setContent] = useState("");
  const [composerMode, setComposerMode] = useState<ComposerMode>("text");
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<DrawingStroke[]>([]);
  const [drawingBackground, setDrawingBackground] = useState(
    () => readDrawingPreferences().background,
  );
  const [media, setMedia] = useState<LocalMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingCropImageId, setPendingCropImageId] = useState<string | null>(null);
  const [cropDialogZIndexClass, setCropDialogZIndexClass] = useState("z-[70]");
  const [selectionRange, setSelectionRange] = useState<TextSelectionRange>({
    start: 0,
    end: 0,
  });

  // OGP: debounced URL extracted from content
  const [ogpUrl, setOgpUrl] = useState<string | null>(null);

  // Refs
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef(0);
  const latestMediaRef = useRef<LocalMedia[]>([]);
  /**
   * The video being transcoded, if any. Videos convert one at a time on submit,
   * and removing that one aborts its transcode.
   */
  const videoConvertRef = useRef<{ localId: string; controller: AbortController } | null>(null);

  // Mutations
  const createPostMutation = useCreatePost();
  const uploadMediaMutation = useUploadMedia();
  const uploadDrawingMutation = useUploadDrawing();

  // Computed values
  const maxContentLength = mediaLimits.maxPostContentLength;
  const maxDrawingInputBytes =
    serverConfig?.drawingLimits.maxInputBytes ?? FALLBACK_MAX_DRAWING_INPUT_BYTES;
  const maxDrawingStrokes = serverConfig?.drawingLimits.maxStrokes ?? FALLBACK_MAX_DRAWING_STROKES;
  const maxDrawingPoints = serverConfig?.drawingLimits.maxPoints ?? FALLBACK_MAX_DRAWING_POINTS;
  const contentLength = content.length;
  const contentPercentage = (contentLength / maxContentLength) * 100;
  const showCharacterCount = contentPercentage >= CHARACTER_COUNT_THRESHOLD;
  const hasContent = content.trim().length > 0;
  const hasMedia = media.length > 0;
  const isContentValid = contentLength <= maxContentLength;
  const isMediaUploadDisabled =
    media.length >= MAX_MEDIA || createPostMutation.isPending || isUploading;
  const isDropDisabled = composerMode === "drawing" || isMediaUploadDisabled;
  const canPost =
    (referenceId ? hasContent : hasContent || hasMedia) &&
    isContentValid &&
    !createPostMutation.isPending &&
    !isUploading &&
    // Posting an unconverted video would send a format the backend rejects.
    !media.some((m) => m.type === "video" && m.converting);

  // Build a unified PreviewMediaItem list for the shared PostMediaPreview component
  const previewMedia: PreviewMediaItem[] = useMemo(
    () =>
      media.map((m) => ({
        id: m.localId,
        type: m.type,
        url: m.previewUrl,
        width: m.width,
        height: m.height,
        quality: m.quality,
        allowNoConversion: m.canSkipConversion,
        ...(m.type === "video"
          ? { thumbnailUrl: null, conversionProgress: m.converting ? m.progress : null }
          : { isAnimated: m.isAnimated }),
      })),
    [media],
  );

  useEffect(() => {
    latestMediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      for (const item of latestMediaRef.current) revokeLocalMedia(item);
    };
  }, []);

  const updateVideo = (localId: string, patch: Partial<LocalVideo>) =>
    setMedia((prev) =>
      prev.map((m) => (m.type === "video" && m.localId === localId ? { ...m, ...patch } : m)),
    );

  const updateImage = (localId: string, update: (image: LocalImage) => LocalImage) =>
    setMedia((prev) =>
      prev.map((m) => (m.type === "image" && m.localId === localId ? update(m) : m)),
    );

  // Only extract OGP URL when there is no media attached (same rule as PostCard).
  // Cleared once per attach, not per keystroke: a setState here on every
  // content change queues a re-render after each typed character, and fast
  // typing piles those up until React aborts the keystroke with error #185.
  useEffect(() => {
    if (hasMedia) setOgpUrl(null);
  }, [hasMedia]);

  // OGP URL extraction with debounce
  useEffect(() => {
    if (hasMedia) return;

    const timer = setTimeout(() => {
      const url = content ? extractFirstUrl(content) : null;
      setOgpUrl(url);
    }, OGP_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [content, hasMedia]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (!autoResize) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    // Override min-height to prevent CSS min-height from inflating scrollHeight
    textarea.style.minHeight = "0";
    textarea.style.height = "0";
    const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${newHeight}px`;
  }, [content, autoResize]);

  /** Change how hard an attachment will be compressed on upload. */
  const handleQualityChange = (localId: string, quality: QualityMode) => {
    const target = media.find((m) => m.localId === localId);
    if (target?.type === "video") {
      // The video control never offers dot-by-dot, so this only guards the type.
      if (!isVideoMode(quality)) return;
      saveQualityMode("video", quality);
      updateVideo(localId, { quality });
      return;
    }
    saveQualityMode("image", quality);
    updateImage(localId, (img) => ({ ...img, quality }));
  };

  /** Validate a video and build its attachment; null (with a toast) when refused. */
  const prepareVideo = async (videoFile: File): Promise<LocalMedia | null> => {
    // Guard the raw import only. The server limit applies to the normalized
    // WebM, which is far smaller, so it is checked by the 413 handler instead.
    if (videoFile.size > MAX_RAW_VIDEO_BYTES) {
      toast.error(
        t("createPost.videoTooLarge", {
          maxSize: mediaLimits.videoMaxUploadSizeMB,
        }),
      );
      return null;
    }

    // Check the duration before offering the mode picker, so an over-long
    // video is refused without the poster first choosing how to convert it.
    const previewUrl = URL.createObjectURL(videoFile);
    let tooLong = false;
    try {
      const meta = await getVideoMetadata(previewUrl);
      // Some containers report Infinity/NaN until fully buffered; the server
      // re-checks the duration anyway, so only reject on a known-bad value.
      tooLong = Number.isFinite(meta.duration) && meta.duration > mediaLimits.maxVideoDurationSec;
    } catch {
      // Unreadable metadata is left to the server to judge.
    }
    URL.revokeObjectURL(previewUrl);

    if (tooLong) {
      toast.error(
        t("createPost.videoTooLong", {
          maxDuration: mediaLimits.maxVideoDurationSec,
        }),
      );
      return null;
    }

    const attachedUrl = URL.createObjectURL(videoFile);
    let width = 1920;
    let height = 1080;
    try {
      const meta = await getVideoMetadata(attachedUrl);
      width = meta.width;
      height = meta.height;
    } catch {
      // Fall back to default dimensions if metadata cannot be read.
    }

    // The duration was checked above, so eligibility rests on type and size.
    const canSkipConversion = canUploadUntouched(
      videoFile,
      mediaLimits.maxVideoBytes,
      mediaLimits.videoMimeTypes,
    );

    return {
      type: "video",
      localId: crypto.randomUUID(),
      file: videoFile,
      previewUrl: attachedUrl,
      width,
      height,
      converting: false,
      progress: 0,
      quality: loadQualityMode("video", canSkipConversion),
      canSkipConversion,
    };
  };

  /** Validate an image and build its attachment; null (with a toast) when refused. */
  const prepareImage = async (file: File): Promise<LocalMedia | null> => {
    // GIFs are uploaded as-is, so the server limit applies directly. Everything
    // else is re-encoded to WebP first, so only the raw import is guarded here.
    const rawCap = isGifFile(file) ? mediaLimits.maxImageBytes : MAX_RAW_IMAGE_BYTES;
    if (file.size > rawCap) {
      toast.error(t("createPost.fileTooLarge"));
      return null;
    }

    const canSkipConversion = canUploadUntouched(
      file,
      mediaLimits.maxImageBytes,
      mediaLimits.imageMimeTypes,
    );

    // Create preview via Object URL (blob:)
    try {
      const previewUrl = URL.createObjectURL(file);

      // Extract image dimensions
      let width = 800;
      let height = 800;
      try {
        const dims = await getImageDimensions(previewUrl);
        width = dims.width;
        height = dims.height;
      } catch {
        // Fall back to default dimensions
      }

      return {
        type: "image",
        localId: crypto.randomUUID(),
        originalFile: file,
        originalPreviewUrl: previewUrl,
        croppedFile: null,
        croppedPreviewUrl: null,
        crop: null,
        cropTransform: null,
        cropAspectId: null,
        file,
        previewUrl,
        isAnimated: isGifFile(file),
        quality: loadQualityMode("image", canSkipConversion),
        canSkipConversion,
        width,
        height,
      };
    } catch (error) {
      console.error("Failed to create preview URL:", error);
      toast.error(t("createPost.uploadError"));
      return null;
    }
  };

  // Process files (validation and preview generation)
  const processFiles = async (files: File[] | FileList) => {
    const fileArray = Array.from(files);
    const accepted = fileArray.filter((f) => isImageFile(f) || isVideoFile(f));

    // Reject unknown file types
    if (accepted.length < fileArray.length) {
      toast.error(t("createPost.invalidFileType"));
    }
    if (accepted.length === 0) return;

    if (media.length + accepted.length > MAX_MEDIA) {
      toast.error(t("createPost.tooManyFiles", { max: MAX_MEDIA }));
      return;
    }

    // Images and videos keep the order they were picked in.
    const added: LocalMedia[] = [];
    for (const file of accepted) {
      const item = isVideoFile(file) ? await prepareVideo(file) : await prepareImage(file);
      if (item) added.push(item);
    }

    if (added.length > 0) {
      setMedia((prev) => [...prev, ...added]);
    }
  };

  // Handlers
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canPost) {
        handlePost();
      }
    }
  };

  const handleMediaSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFiles(files);

    // Reset the file input so the same file can be re-selected
    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    // Check for URL paste while text is selected → auto-format as link
    const textarea = textareaRef.current;
    if (textarea) {
      const { selectionStart, selectionEnd, value } = textarea;
      if (selectionStart !== selectionEnd) {
        const pastedText = e.clipboardData?.getData("text/plain") ?? "";
        if (pastedText && /^https?:\/\/\S+$/.test(pastedText.trim())) {
          e.preventDefault();
          const selected = value.slice(selectionStart, selectionEnd);
          const url = pastedText.trim();
          const linkSyntax = `[${selected}](${url})`;
          const newValue = value.slice(0, selectionStart) + linkSyntax + value.slice(selectionEnd);
          setContent(newValue);
          // Select the display text inside []
          const cursorStart = selectionStart + 1;
          const cursorEnd = selectionStart + 1 + selected.length;
          requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(cursorStart, cursorEnd);
          });
          return;
        }
      }
    }

    const pastedFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (!file) continue;
      pastedFiles.push(file);
    }

    if (pastedFiles.length === 0) return;

    e.preventDefault();
    await processFiles(pastedFiles);
  };

  /** Remove handler for PostMediaPreview, images and videos alike. */
  const handleRemoveMedia = (localId: string) => {
    const target = media.find((m) => m.localId === localId);
    if (!target) return;
    // Encoding runs to the end on its own; without this it keeps a phone's
    // CPU busy for a video nobody is going to post.
    if (videoConvertRef.current?.localId === localId) videoConvertRef.current.controller.abort();
    revokeLocalMedia(target);
    setMedia((prev) => prev.filter((m) => m.localId !== localId));
    if (pendingCropImageId === localId) {
      setCropDialogOpen(false);
      setCropImageSrc(null);
      setPendingCropImageId(null);
    }
  };

  const handleCropOpen = useCallback(
    async (localId: string) => {
      const target = findImage(media, localId);
      if (!target || target.isAnimated) return;

      try {
        const src = await readFileAsDataUrl(target.originalFile);
        setCropDialogZIndexClass("z-[70]");
        setCropImageSrc(src);
        setPendingCropImageId(localId);
        setCropDialogOpen(true);
      } catch {
        toast.error(t("createPost.uploadError"));
      }
    },
    [media, t],
  );

  const handleCropDialogOpenChange = (open: boolean) => {
    setCropDialogOpen(open);
    if (!open) {
      setCropImageSrc(null);
      setPendingCropImageId(null);
      setCropDialogZIndexClass("z-[70]");
    }
  };

  const handleCropComplete = useCallback(
    async (croppedFile: File, crop?: Crop, transform?: Transform, aspectId?: AspectRatioId) => {
      if (!pendingCropImageId) return;

      const croppedPreviewUrl = URL.createObjectURL(croppedFile);
      let width = 800;
      let height = 800;
      try {
        const dims = await getImageDimensions(croppedPreviewUrl);
        width = dims.width;
        height = dims.height;
      } catch {
        // Fall back to default dimensions
      }

      setMedia((prev) =>
        prev.map((m) => {
          if (m.type !== "image" || m.localId !== pendingCropImageId) return m;
          if (m.croppedPreviewUrl) {
            URL.revokeObjectURL(m.croppedPreviewUrl);
          }
          return {
            ...m,
            croppedFile,
            croppedPreviewUrl,
            crop: crop ?? m.crop,
            cropTransform: transform ?? m.cropTransform,
            cropAspectId: aspectId ?? m.cropAspectId,
            file: croppedFile,
            previewUrl: croppedPreviewUrl,
            width,
            height,
          };
        }),
      );

      setCropDialogOpen(false);
      setCropImageSrc(null);
      setPendingCropImageId(null);
      setCropDialogZIndexClass("z-[70]");
    },
    [pendingCropImageId],
  );

  const handleDragOver = (e: React.DragEvent) => {
    // Only prevent default for file drops
    const hasFiles = e.dataTransfer?.types?.includes("Files");
    if (hasFiles) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    // Only show overlay if files are being dragged
    const hasFiles = e.dataTransfer?.types?.includes("Files");
    if (!hasFiles) return;

    e.preventDefault();
    e.stopPropagation();

    if (isDropDisabled) return;

    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only update counter if files were being dragged
    const hasFiles = e.dataTransfer?.types?.includes("Files");
    if (!hasFiles) return;

    e.preventDefault();
    e.stopPropagation();

    if (isDropDisabled) return;

    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    const files = e.dataTransfer?.files;

    // Only handle file drops
    if (!files || files.length === 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current = 0;
    setIsDragging(false);

    if (isDropDisabled) return;

    await processFiles(files);
  };

  /**
   * Classify an upload error and show the appropriate toast message.
   * Returns true so callers can `return showUploadError(error, "image")`.
   */
  const showUploadError = (error: unknown, kind: "image" | "video") => {
    if (error instanceof MediaNormalizeError) {
      if (error.code === "unsupported_image") {
        toast.error(t("createPost.invalidFileType"));
      } else if (error.code === "image_too_large") {
        toast.error(t("createPost.fileTooLarge"));
      } else if (error.code === "video_too_large") {
        toast.error(
          t("createPost.videoCannotFit", {
            maxSize: mediaLimits.videoMaxUploadSizeMB,
          }),
        );
      } else {
        // The cause carries what mediabunny actually refused (e.g. the reason a
        // track was discarded). Without it the toast is the same sentence for
        // every browser, and a failure that only happens on someone else's
        // phone cannot be reported.
        const reason = error.cause instanceof Error ? error.cause.message : error.code;
        toast.error(`${t("createPost.conversionError")} (${reason})`);
      }
      return;
    }
    if (error instanceof ApiHttpError) {
      if (error.status === 429) {
        const retryAfter = error.retryAfterSeconds;
        if (retryAfter !== null) {
          toast.error(t("createPost.rateLimitedWithRetry", { seconds: retryAfter }));
        } else {
          toast.error(t("createPost.rateLimited"));
        }
        return;
      }
      if (error.status === 413) {
        toast.error(
          kind === "video"
            ? t("createPost.videoTooLarge", { maxSize: mediaLimits.videoMaxUploadSizeMB })
            : t("createPost.fileTooLarge"),
        );
        return;
      }
    }
    // TypeError from a connection reset (e.g. nginx rejecting an oversized upload)
    // manifests as "Failed to fetch" — surface it as a file-too-large hint.
    if (error instanceof TypeError) {
      toast.error(t("createPost.uploadNetworkError"));
      return;
    }
    toast.error(kind === "video" ? t("createPost.videoUploadError") : t("createPost.uploadError"));
  };

  const completePost = () => {
    if (parentId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.post(parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.postContext(parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.replies(parentId) });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "postThread",
      });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "ownerReplyThread",
      });
    }
    if (referenceId) queryClient.invalidateQueries({ queryKey: queryKeys.post(referenceId) });

    toast.success(t("createPost.success"));
    resetForm();
    onSuccess?.();
  };

  const handlePost = async () => {
    if (!canPost) return;

    try {
      setIsUploading(true);

      // Upload every attachment in its preview order; mediaIds keeps that order.
      // ponytail: one at a time, so 20 attachments upload serially; parallelize
      // the images if that wait shows up in practice.
      const mediaIds: string[] = [];

      for (const item of media) {
        if (item.type === "image") {
          try {
            // Normalize here so the poster's per-image choice is applied; the
            // upload path sees an already-marked file and leaves it alone.
            const normalized = await normalizeForUpload(item.file, {
              imageMode: item.quality,
              limits: mediaLimits,
              // The last resort when this browser has no usable encoder: send
              // the original, if the server would have taken it anyway.
              acceptedTypes: mediaLimits.imageMimeTypes,
              maxBytes: mediaLimits.maxImageBytes,
            });
            const result = await uploadMediaMutation.mutateAsync(normalized);
            mediaIds.push(result.id);
          } catch (error) {
            showUploadError(error, "image");
            console.error("Image upload failed:", error);
            setIsUploading(false);
            return;
          }
          continue;
        }

        const video = item;
        try {
          // Converting here rather than on attach keeps the cost off anyone who
          // changes their mind, and the ring on the preview reports progress.
          updateVideo(video.localId, { converting: true, progress: 0 });
          let lastPercent = -1;
          const controller = new AbortController();
          videoConvertRef.current = { localId: video.localId, controller };
          const converted = await normalizeForUpload(video.file, {
            // Encoding to fit means a long video comes out smaller rather than
            // being transcoded in full and then rejected for being too large.
            maxBytes: mediaLimits.maxVideoBytes,
            videoMode: video.quality,
            limits: mediaLimits,
            acceptedTypes: mediaLimits.videoMimeTypes,
            signal: controller.signal,
            onProgress: (progress) => {
              // What mediabunny reports is input fed to the encoder, and the
              // encoder's own queue is flushed after that reads 100% — long
              // enough on slow codecs to look stuck. Hold just short of full so
              // the ring never claims to be done while it is still working.
              const held = Math.min(progress, 0.99);
              // It reports far more often than a percentage can change.
              const percent = Math.round(held * 100);
              if (percent === lastPercent) return;
              lastPercent = percent;
              updateVideo(video.localId, { progress: held });
            },
          });
          // Keep the converted file, so a failure further along does not mean
          // paying for the transcode twice. The indicator stays up through the
          // upload, showing its finished state.
          updateVideo(video.localId, { file: converted, progress: 1 });

          const result = await uploadMediaMutation.mutateAsync(converted);
          updateVideo(video.localId, { converting: false });
          mediaIds.push(result.id);
        } catch (error) {
          updateVideo(video.localId, { converting: false });
          // Removing the video mid-transcode aborts it. That is the user's own
          // doing, so it gets no error about it.
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            showUploadError(error, "video");
            console.error("Video upload failed:", error);
          }
          setIsUploading(false);
          return;
        }
      }

      // Create post with uploaded mediaIds (parentId set when replying).
      // contentPrefix (e.g. an `@author ` reply mention) is prepended here
      // so it never appears in the editable textarea.
      const submittedContent = (contentPrefix ?? "") + content;
      await createPostMutation.mutateAsync({
        content: submittedContent,
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
        parentId,
        referenceId,
      } as components["schemas"]["CreatePostRequest"]);

      completePost();
    } catch (error) {
      toast.error(t("createPost.error"));
      console.error("Post creation failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrawingPost = async (strokes: DrawingStroke[], color: string) => {
    if (strokes.length === 0 || createPostMutation.isPending || isUploading) return false;

    try {
      setIsUploading(true);
      const upload = await createDrawingUpload(strokes, drawingBackground, color);
      const drawing = await uploadDrawingMutation.mutateAsync(upload);
      await createPostMutation.mutateAsync({
        drawingId: drawing.id,
        parentId,
        referenceId,
      });
      completePost();
      return true;
    } catch (error) {
      toast.error(t("createPost.drawing.uploadError"));
      console.error("Drawing post creation failed:", error);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setContent("");
    setComposerMode("text");
    setDrawingStrokes([]);
    setRedoStrokes([]);
    // Revoke all blob URLs on reset
    for (const item of media) revokeLocalMedia(item);
    setMedia([]);
    setOgpUrl(null);
    setIsUploading(false);
    setIsDragging(false);
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setPendingCropImageId(null);
    setCropDialogZIndexClass("z-[70]");
    dragCounterRef.current = 0;
  };

  const pendingCropImage = pendingCropImageId
    ? (findImage(media, pendingCropImageId) ?? null)
    : null;

  return {
    // State
    content,
    setContent,
    composerMode,
    setComposerMode,
    drawingStrokes,
    setDrawingStrokes,
    redoStrokes,
    setRedoStrokes,
    drawingBackground,
    setDrawingBackground,
    media,
    isUploading,
    isDragging,
    ogpUrl,
    selectionRange,

    // Unified media list for PostMediaPreview
    previewMedia,

    // Refs
    mediaFileInputRef,
    textareaRef,

    // Handlers
    handleContentChange,
    handleKeyDown,
    handleMediaSelect,
    handlePaste,
    handleRemoveMedia,
    handleCropOpen,
    handleQualityChange,
    handleCropDialogOpenChange,
    handleCropComplete,
    handlePost,
    handleDrawingPost,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,

    // Computed
    maxContentLength,
    maxDrawingInputBytes,
    maxDrawingStrokes,
    maxDrawingPoints,
    contentLength,
    contentPercentage,
    showCharacterCount,
    canPost,
    isContentValid,
    hasContent,
    hasMedia,
    isDropDisabled,
    isMediaUploadDisabled,

    // Crop state
    cropDialogOpen,
    cropImageSrc,
    pendingCropImage,
    cropDialogZIndexClass,

    // Mutations
    createPostMutation,
    uploadMediaMutation,
    uploadDrawingMutation,

    // Utilities
    resetForm,
    setSelectionRange,
  };
}

/** Return type of the useComposePost hook */
export type UseComposePostReturn = ReturnType<typeof useComposePost>;
