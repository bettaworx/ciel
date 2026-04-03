/**
 * Types for post composition
 */

export interface LocalImage {
  localId: string;
  file: File;
  previewUrl: string; // Object URL (blob:)
  width: number;
  height: number;
}

export interface LocalVideo {
  localId: string;
  file: File;
  previewUrl: string; // Object URL (blob:)
  width: number;
  height: number;
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
  width: number;
  height: number;
  thumbnailUrl?: string | null;
}
