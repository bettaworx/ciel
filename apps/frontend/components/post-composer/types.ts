import type { Dispatch, SetStateAction } from "react";
import type { Crop } from "react-image-crop";
import type { AspectRatioId } from "@/components/shared/image-crop/aspectRatios";
import type { Transform } from "@/components/shared/image-crop/transforms";
import type {
  ImageQualityMode,
  VideoQualityMode,
} from "@/lib/media/normalize";

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
  /** How hard to compress on upload; chosen per image from the preview. */
  quality: ImageQualityMode;
  /** True when the file already suits the server and may be uploaded untouched. */
  canSkipConversion: boolean;
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
  /** True while the file is being converted on submit. */
  converting: boolean;
  /** Conversion progress, 0-1. */
  progress: number;
  /** How hard to compress on upload; chosen from the preview. */
  quality: VideoQualityMode;
  /** True when the file already suits the server and may be uploaded untouched. */
  canSkipConversion: boolean;
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
  /** Compression mode for an editable attachment, shown on its own control. */
  quality?: ImageQualityMode | VideoQualityMode;
  /** Whether the "upload untouched" mode is on offer for this attachment. */
  allowNoConversion?: boolean;
}

export interface TextSelectionRange {
  start: number;
  end: number;
}

export type TextSelectionRangeSetter = Dispatch<
  SetStateAction<TextSelectionRange>
>;
