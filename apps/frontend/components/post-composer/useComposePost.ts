"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCreatePost, useUploadMedia, useMediaLimits } from "@/lib/hooks/use-queries";
import { ApiHttpError } from "@/lib/api/client";
import { extractFirstUrl } from "@/lib/ogp/extract-url";
import type { components } from "@/lib/api/api";
import type {
  LocalImage,
  LocalVideo,
  PreviewMediaItem,
  TextSelectionRange,
} from "./types";
import {
  MAX_IMAGES,
  MAX_VIDEOS,
  MAX_TEXTAREA_HEIGHT,
  CHARACTER_COUNT_THRESHOLD,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from "./constants";
import type { Crop } from "react-image-crop";
import type { AspectRatioId } from "@/components/shared/image-crop/aspectRatios";
import type { Transform } from "@/components/shared/image-crop/transforms";

/** Debounce delay (ms) for OGP URL extraction from content. */
const OGP_DEBOUNCE_MS = 400;

interface UseComposePostOptions {
  onSuccess?: () => void;
  autoResize?: boolean;
}

function isVideoFile(file: File): boolean {
  return ACCEPTED_VIDEO_TYPES.includes(file.type as (typeof ACCEPTED_VIDEO_TYPES)[number]);
}

function isImageFile(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]);
}

function isAnimatedImageFile(file: File): boolean {
  return file.type === "image/gif";
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
 * Load a video blob URL and return its native dimensions.
 */
function getVideoDimensions(blobUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      resolve({ width: vid.videoWidth, height: vid.videoHeight });
      // Clean up to release the blob reference held by the video element
      vid.src = "";
      vid.load();
    };
    vid.onerror = reject;
    vid.src = blobUrl;
  });
}

/**
 * Custom hook for post composition logic
 * Handles state management, file processing, and post submission
 *
 * Media rules:
 * - A post can contain either up to MAX_IMAGES images OR MAX_VIDEOS video, not both.
 * - All local files use URL.createObjectURL for preview (blob: URLs).
 * - Video size limit is separate from image size limit (fetched from server).
 */
export function useComposePost(options: UseComposePostOptions = {}) {
  const { onSuccess, autoResize = true } = options;
  const t = useTranslations();
  const mediaLimits = useMediaLimits();

  // State
  const [content, setContent] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [video, setVideo] = useState<LocalVideo | null>(null);
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
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef(0);
  const latestImagesRef = useRef<LocalImage[]>([]);
  const latestVideoRef = useRef<LocalVideo | null>(null);

  // Mutations
  const createPostMutation = useCreatePost();
  const uploadMediaMutation = useUploadMedia();

  // Computed values
  const maxContentLength = mediaLimits.maxPostContentLength;
  const contentLength = content.length;
  const contentPercentage = (contentLength / maxContentLength) * 100;
  const showCharacterCount = contentPercentage >= CHARACTER_COUNT_THRESHOLD;
  const hasContent = content.trim().length > 0;
  const hasImages = images.length > 0;
  const hasVideo = video !== null;
  const hasMedia = hasImages || hasVideo;
  const isContentValid = contentLength <= maxContentLength;
  const isDropDisabled =
    (hasVideo || images.length >= MAX_IMAGES) ||
    createPostMutation.isPending ||
    isUploading;
  /** Image upload is disabled when a video is attached or max images reached */
  const isImageUploadDisabled =
    hasVideo || images.length >= MAX_IMAGES ||
    createPostMutation.isPending ||
    isUploading;
  /** Video upload is disabled when images are attached or a video is already attached */
  const isVideoUploadDisabled =
    hasImages || hasVideo ||
    createPostMutation.isPending ||
    isUploading;
  const canPost =
    (hasContent || hasMedia) &&
    isContentValid &&
    !createPostMutation.isPending &&
    !isUploading;

  // Build a unified PreviewMediaItem list for the shared PostMediaPreview component
  const previewMedia: PreviewMediaItem[] = useMemo(() => {
    if (video) {
      return [
        {
          id: video.localId,
          type: "video" as const,
          url: video.previewUrl,
          width: video.width,
          height: video.height,
          thumbnailUrl: null,
        },
      ];
    }
    return images.map((img) => ({
      id: img.localId,
      type: "image" as const,
      url: img.previewUrl,
      isAnimated: img.isAnimated,
      width: img.width,
      height: img.height,
    }));
  }, [images, video]);

  useEffect(() => {
    latestImagesRef.current = images;
  }, [images]);

  useEffect(() => {
    latestVideoRef.current = video;
  }, [video]);

  useEffect(() => {
    return () => {
      for (const img of latestImagesRef.current) {
        URL.revokeObjectURL(img.originalPreviewUrl);
        if (img.croppedPreviewUrl) {
          URL.revokeObjectURL(img.croppedPreviewUrl);
        }
      }
      const latestVideo = latestVideoRef.current;
      if (latestVideo) {
        URL.revokeObjectURL(latestVideo.previewUrl);
      }
    };
  }, []);

  // OGP URL extraction with debounce
  useEffect(() => {
    // Only extract OGP URL when there is no media attached (same rule as PostCard)
    if (hasMedia) {
      setOgpUrl(null);
      return;
    }

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

  // Process files (validation and preview generation)
  const processFiles = async (files: File[] | FileList) => {
    const fileArray = Array.from(files);

    // Separate into images and videos
    const imageFiles = fileArray.filter((f) => isImageFile(f));
    const videoFiles = fileArray.filter((f) => isVideoFile(f));
    const unknownFiles = fileArray.filter((f) => !isImageFile(f) && !isVideoFile(f));

    // Reject unknown file types
    if (unknownFiles.length > 0) {
      toast.error(t("createPost.invalidFileType"));
    }

    // Cannot mix images and video
    if (imageFiles.length > 0 && (videoFiles.length > 0 || hasVideo)) {
      toast.error(t("createPost.cannotMixMediaTypes"));
      return;
    }
    if (videoFiles.length > 0 && hasImages) {
      toast.error(t("createPost.cannotMixMediaTypes"));
      return;
    }

    // Process video files
    if (videoFiles.length > 0) {
      // Only allow MAX_VIDEOS video
      if (hasVideo || videoFiles.length > MAX_VIDEOS) {
        toast.error(t("createPost.tooManyVideos"));
        return;
      }

      const videoFile = videoFiles[0];

      // Validate file size against video-specific limit
      if (videoFile.size > mediaLimits.videoMaxUploadSizeBytes) {
        toast.error(
          t("createPost.videoTooLarge", {
            maxSize: mediaLimits.videoMaxUploadSizeMB,
          }),
        );
        return;
      }

      // Create preview via Object URL (efficient for large files)
      const previewUrl = URL.createObjectURL(videoFile);

      // Extract video dimensions from metadata
      let width = 1920;
      let height = 1080;
      try {
        const dims = await getVideoDimensions(previewUrl);
        width = dims.width;
        height = dims.height;
      } catch {
        // Fall back to default dimensions if metadata cannot be read
      }

      setVideo({
        localId: crypto.randomUUID(),
        file: videoFile,
        previewUrl,
        width,
        height,
      });
      return;
    }

    // Process image files
    if (imageFiles.length > 0) {
      // Check max images
      if (images.length + imageFiles.length > MAX_IMAGES) {
        toast.error(t("createPost.tooManyFiles"));
        return;
      }

      const newImages: LocalImage[] = [];

      for (const file of imageFiles) {
        // Validate file size against image limit
        if (file.size > mediaLimits.maxUploadSizeBytes) {
          toast.error(t("createPost.fileTooLarge"));
          continue;
        }

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

          newImages.push({
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
            isAnimated: isAnimatedImageFile(file),
            width,
            height,
          });
        } catch (error) {
          console.error("Failed to create preview URL:", error);
          toast.error(t("createPost.uploadError"));
        }
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }
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

  const handleImageSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await processFiles(files);

    // Reset file inputs so the same file can be re-selected
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = "";
    }
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = "";
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
          const newValue =
            value.slice(0, selectionStart) +
            linkSyntax +
            value.slice(selectionEnd);
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

  const handleRemoveImage = (localId: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.localId === localId);
      // Revoke blob URL to free memory
      if (image) {
        URL.revokeObjectURL(image.originalPreviewUrl);
        if (image.croppedPreviewUrl) {
          URL.revokeObjectURL(image.croppedPreviewUrl);
        }
      }
      return prev.filter((img) => img.localId !== localId);
    });
    if (pendingCropImageId === localId) {
      setCropDialogOpen(false);
      setCropImageSrc(null);
      setPendingCropImageId(null);
    }
  };

  const handleRemoveVideo = () => {
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
      setVideo(null);
    }
  };

  /** Generic remove handler for PostMediaPreview (dispatches by id). */
  const handleRemoveMedia = (id: string) => {
    if (video && video.localId === id) {
      handleRemoveVideo();
    } else {
      handleRemoveImage(id);
    }
  };

  const handleCropOpen = useCallback(
    async (localId: string) => {
      const target = images.find((img) => img.localId === localId);
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
    [images, t],
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
    async (
      croppedFile: File,
      crop?: Crop,
      transform?: Transform,
      aspectId?: AspectRatioId,
    ) => {
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

      setImages((prev) =>
        prev.map((img) => {
          if (img.localId !== pendingCropImageId) return img;
          if (img.croppedPreviewUrl) {
            URL.revokeObjectURL(img.croppedPreviewUrl);
          }
          return {
            ...img,
            croppedFile,
            croppedPreviewUrl,
            crop: crop ?? img.crop,
            cropTransform: transform ?? img.cropTransform,
            cropAspectId: aspectId ?? img.cropAspectId,
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
    toast.error(
      kind === "video"
        ? t("createPost.videoUploadError")
        : t("createPost.uploadError"),
    );
  };

  const handlePost = async () => {
    if (!canPost) return;

    try {
      setIsUploading(true);

      // Upload all media (images + video)
      const mediaIds: string[] = [];

      // Upload images
      if (images.length > 0) {
        for (const image of images) {
          try {
            const result = await uploadMediaMutation.mutateAsync(image.file);
            mediaIds.push(result.id);
          } catch (error) {
            showUploadError(error, "image");
            console.error("Image upload failed:", error);
            setIsUploading(false);
            return;
          }
        }
      }

      // Upload video
      if (video) {
        try {
          const result = await uploadMediaMutation.mutateAsync(video.file);
          mediaIds.push(result.id);
        } catch (error) {
          showUploadError(error, "video");
          console.error("Video upload failed:", error);
          setIsUploading(false);
          return;
        }
      }

      // Create post with uploaded mediaIds
      await createPostMutation.mutateAsync({
        content,
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      } as components["schemas"]["CreatePostRequest"]);

      toast.success(t("createPost.success"));

      // Reset form
      resetForm();

      // Call success callback
      onSuccess?.();
    } catch (error) {
      toast.error(t("createPost.error"));
      console.error("Post creation failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setContent("");
    // Revoke all blob URLs on reset
    for (const img of images) {
      URL.revokeObjectURL(img.originalPreviewUrl);
      if (img.croppedPreviewUrl) {
        URL.revokeObjectURL(img.croppedPreviewUrl);
      }
    }
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
    }
    setImages([]);
    setVideo(null);
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
    ? images.find((img) => img.localId === pendingCropImageId) ?? null
    : null;

  return {
    // State
    content,
    setContent,
    images,
    video,
    isUploading,
    isDragging,
    ogpUrl,
    selectionRange,

    // Unified media list for PostMediaPreview
    previewMedia,

    // Refs
    imageFileInputRef,
    videoFileInputRef,
    textareaRef,

    // Handlers
    handleContentChange,
    handleKeyDown,
    handleImageSelect,
    handlePaste,
    handleRemoveImage,
    handleRemoveVideo,
    handleRemoveMedia,
    handleCropOpen,
    handleCropDialogOpenChange,
    handleCropComplete,
    handlePost,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,

    // Computed
    maxContentLength,
    contentLength,
    contentPercentage,
    showCharacterCount,
    canPost,
    isContentValid,
    hasContent,
    hasImages,
    hasVideo,
    hasMedia,
    isDropDisabled,
    isImageUploadDisabled,
    isVideoUploadDisabled,

    // Crop state
    cropDialogOpen,
    cropImageSrc,
    pendingCropImage,
    cropDialogZIndexClass,

    // Mutations
    createPostMutation,
    uploadMediaMutation,

    // Utilities
    resetForm,
    setSelectionRange,
  };
}

/** Return type of the useComposePost hook */
export type UseComposePostReturn = ReturnType<typeof useComposePost>;
