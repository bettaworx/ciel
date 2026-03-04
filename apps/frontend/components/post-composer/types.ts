/**
 * Types for post composition
 */

export interface LocalImage {
  localId: string;
  file: File;
  previewUrl: string; // Base64 data URL
}

export interface LocalVideo {
  localId: string;
  file: File;
  previewUrl: string; // Object URL (blob:)
}

export type LocalMedia =
  | { kind: "image"; data: LocalImage }
  | { kind: "video"; data: LocalVideo };
