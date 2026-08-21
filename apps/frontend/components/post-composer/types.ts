import type { Dispatch, SetStateAction } from "react";
import type { Crop } from "react-image-crop";
import type { AspectRatioId } from "@/components/shared/image-crop/aspectRatios";
import type { Transform } from "@/components/shared/image-crop/transforms";

/**
 * Types for post composition
 */

export interface LocalImage {
  localId: string;
  originalFile: File;
  originalPreviewUrl: string; // Object URL (blob:) for original file
  croppedFile: File | null;
  croppedPreviewUrl: string | null; // Object URL (blob:) for current cropped file
  crop: Crop | null;
  cropTransform: Transform | null;
  cropAspectId: AspectRatioId | null;
  file: File;
  previewUrl: string; // Object URL (blob:)
  isAnimated: boolean; // true for GIF and other animated image formats
  width: number;
  height: number;
}

export interface LocalVideo {
  localId: string;
  /** The original file until conversion finishes, then the normalized WebM/MP4. */
  file: File;
  previewUrl: string; // Object URL (blob:) of the *original* file
  width: number;
  height: number;
  /** True while the file is being converted; posting is blocked until it clears. */
  converting: boolean;
  /** Conversion progress, 0-1. */
  progress: number;
  /** Aborts the in-flight conversion when the video is removed. */
  abort: AbortController;
}

export type LocalMedia =
  | { kind: "image"; data: LocalImage }
  | { kind: "video"; data: LocalVideo };

/**
 * Unified media item type used by the shared PostMediaPreview component.
 * Works for both local (blob://) and remote (https://) media.
 */
export interface PreviewMediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  isAnimated?: boolean;
  width: number;
  height: number;
  thumbnailUrl?: string | null;
  blurhash?: string | null;
  /** 0-1 while the composer is converting this item; null/undefined otherwise. */
  conversionProgress?: number | null;
}

export interface TextSelectionRange {
  start: number;
  end: number;
}

export type TextSelectionRangeSetter = Dispatch<
  SetStateAction<TextSelectionRange>
>;
