import type { Dispatch, SetStateAction } from "react";
import type { Crop } from "react-image-crop";
import type { AspectRatioId } from "@/components/shared/image-crop/aspectRatios";
import type { Transform } from "@/components/shared/image-crop/transforms";
import type { ImageQualityMode, VideoQualityMode } from "@/lib/media/normalize";

/**
 * Types for post composition
 */

/** What every composer attachment has, whether it is an image or a video. */
interface LocalMediaBase {
  localId: string;
  /** The file that will be uploaded. */
  file: File;
  previewUrl: string; // Object URL (blob:)
  width: number;
  height: number;
  /** True when the file already suits the server and may be uploaded untouched. */
  canSkipConversion: boolean;
}

export interface LocalImage extends LocalMediaBase {
  type: "image";
  originalFile: File;
  originalPreviewUrl: string; // Object URL (blob:) for original file
  croppedFile: File | null;
  croppedPreviewUrl: string | null; // Object URL (blob:) for current cropped file
  crop: Crop | null;
  cropTransform: Transform | null;
  cropAspectId: AspectRatioId | null;
  isAnimated: boolean; // true for GIF and other animated image formats
  /** How hard to compress on upload; chosen per image from the preview. */
  quality: ImageQualityMode;
}

export interface LocalVideo extends LocalMediaBase {
  type: "video";
  // `file` is the original until conversion finishes, then the normalized
  // WebM/MP4; `previewUrl` always points at the original.
  /** True while the file is being converted on submit. */
  converting: boolean;
  /** Conversion progress, 0-1. */
  progress: number;
  /** How hard to compress on upload; chosen from the preview. */
  quality: VideoQualityMode;
}

/**
 * One attachment in the composer. Images and videos are both media: they share
 * one ordered list and one per-post limit, and `type` says which it is, as on
 * the API's Media.
 */
export type LocalMedia = LocalImage | LocalVideo;

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

export type TextSelectionRangeSetter = Dispatch<SetStateAction<TextSelectionRange>>;
