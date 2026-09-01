import type { components } from "@/lib/api/api";

type ServerConfig = components["schemas"]["ServerConfig"];

/**
 * What the server will accept, as the browser needs to hear it.
 *
 * The server states its rules once, in /server/config; everything the client
 * decides about media derives from here. Keeping a second copy in the client is
 * how the two silently drift — an extension allowed on one side and refused on
 * the other, with no error until an upload fails.
 */
export type MediaRequirements = {
  /** MIME types the server accepts for stills, derived from its extension list. */
  imageMimeTypes: string[];
  /** MIME types the server accepts for video. */
  videoMimeTypes: string[];
  maxImageBytes: number;
  maxVideoBytes: number;
  maxVideoDurationSec: number;
  maxWidth: number;
  maxHeight: number;
  maxPixels: number;
  maxFrameRate: number;
};

/**
 * The server speaks in extensions and the browser in MIME types, so one of them
 * has to translate. Entries the server never lists are simply never produced.
 */
const MIME_FOR_EXTENSION: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webm: "video/webm",
  mp4: "video/mp4",
};

/**
 * Stand-in until /server/config answers. Deliberately the shipped defaults, so a
 * first paint before the request lands behaves like an untouched server rather
 * than like nothing at all.
 */
export const FALLBACK_MEDIA_REQUIREMENTS: MediaRequirements = {
  imageMimeTypes: ["image/webp", "image/png", "image/jpeg", "image/gif"],
  videoMimeTypes: ["video/webm", "video/mp4"],
  maxImageBytes: 15 * 1024 * 1024,
  maxVideoBytes: 100 * 1024 * 1024,
  maxVideoDurationSec: 300,
  maxWidth: 16384,
  maxHeight: 16384,
  maxPixels: 50_000_000,
  maxFrameRate: 60,
};

function mimeTypesFor(extensions: string[], prefix: string): string[] {
  const seen = new Set<string>();
  for (const ext of extensions) {
    const mime = MIME_FOR_EXTENSION[ext.replace(/^\./, "").toLowerCase()];
    // An extension with no mapping is one this client cannot recognise anyway.
    if (mime?.startsWith(prefix)) seen.add(mime);
  }
  return [...seen];
}

/** Read the server's rules, falling back while the config request is in flight. */
export function toMediaRequirements(
  config: ServerConfig | undefined,
): MediaRequirements {
  const limits = config?.mediaLimits;
  if (!limits) return FALLBACK_MEDIA_REQUIREMENTS;

  return {
    imageMimeTypes: mimeTypesFor(limits.allowedExtensions, "image/"),
    videoMimeTypes: mimeTypesFor(limits.allowedExtensions, "video/"),
    maxImageBytes: limits.maxUploadSizeMB * 1024 * 1024,
    maxVideoBytes: limits.video.maxUploadSizeMB * 1024 * 1024,
    maxVideoDurationSec: limits.video.maxDurationSeconds,
    maxWidth: limits.maxInputWidth,
    maxHeight: limits.maxInputHeight,
    maxPixels: limits.maxInputPixels,
    maxFrameRate: limits.video.maxFrameRate,
  };
}
