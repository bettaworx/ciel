"use client";

import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCreatePost, useUploadMedia, useMediaLimits } from "@/lib/hooks/use-queries";
import type { components } from "@/lib/api/api";
import type { LocalImage, LocalVideo } from "./types";
import {
  MAX_CONTENT_LENGTH,
  MAX_IMAGES,
  MAX_VIDEOS,
  MAX_TEXTAREA_HEIGHT,
  CHARACTER_COUNT_THRESHOLD,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
} from "./constants";

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

/**
 * Custom hook for post composition logic
 * Handles state management, file processing, and post submission
 *
 * Media rules:
 * - A post can contain either up to MAX_IMAGES images OR MAX_VIDEOS video, not both.
 * - Video files use URL.createObjectURL for preview (not Base64).
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

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounterRef = useRef(0);

  // Mutations
  const createPostMutation = useCreatePost();
  const uploadMediaMutation = useUploadMedia();

  // Computed values
  const contentLength = content.length;
  const contentPercentage = (contentLength / MAX_CONTENT_LENGTH) * 100;
  const showCharacterCount = contentPercentage >= CHARACTER_COUNT_THRESHOLD;
  const hasContent = content.trim().length > 0;
  const hasImages = images.length > 0;
  const hasVideo = video !== null;
  const hasMedia = hasImages || hasVideo;
  const isContentValid = contentLength <= MAX_CONTENT_LENGTH;
  const isDropDisabled =
    (hasVideo || images.length >= MAX_IMAGES) ||
    createPostMutation.isPending ||
    isUploading;
  const canPost =
    (hasContent || hasMedia) &&
    isContentValid &&
    !createPostMutation.isPending &&
    !isUploading;

  // Auto-resize textarea based on content
  useEffect(() => {
    if (!autoResize) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
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
      setVideo({
        localId: `${Date.now()}-${Math.random()}`,
        file: videoFile,
        previewUrl,
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

        // Convert to Base64 for preview
        try {
          const previewUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newImages.push({
            localId: `${Date.now()}-${Math.random()}`,
            file,
            previewUrl,
          });
        } catch (error) {
          console.error("Failed to read file:", error);
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

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
      // Revoke blob URL if it exists to free memory
      if (image?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter((img) => img.localId !== localId);
    });
  };

  const handleRemoveVideo = () => {
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
      setVideo(null);
    }
  };

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
            toast.error(t("createPost.uploadError"));
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
          toast.error(t("createPost.videoUploadError"));
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
    // Revoke video blob URL on reset
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
    }
    setImages([]);
    setVideo(null);
    setIsUploading(false);
    setIsDragging(false);
    dragCounterRef.current = 0;
  };

  return {
    // State
    content,
    setContent,
    images,
    video,
    isUploading,
    isDragging,

    // Refs
    fileInputRef,
    textareaRef,

    // Handlers
    handleContentChange,
    handleKeyDown,
    handleImageSelect,
    handlePaste,
    handleRemoveImage,
    handleRemoveVideo,
    handlePost,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,

    // Computed
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

    // Mutations
    createPostMutation,
    uploadMediaMutation,

    // Utilities
    resetForm,
  };
}
