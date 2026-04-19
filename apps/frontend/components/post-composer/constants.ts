/**
 * Constants for post composition
 */

export const MAX_CONTENT_LENGTH = 1000;
export const MAX_IMAGES = 4;
export const MAX_VIDEOS = 1;

// Note: File size limit is now dynamically fetched from server-info API
// See useMediaLimits() hook in @/lib/hooks/use-queries

export const MAX_TEXTAREA_HEIGHT = 400; // px
export const CHARACTER_COUNT_THRESHOLD = 75; // Show count at 75%
export const WARNING_THRESHOLD = 90; // Yellow at 90%

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/x-matroska", // .mkv
  "video/mp4", // .m4v (same MIME as mp4)
  "video/3gpp", // .3gp
  "video/ogg", // .ogv
] as const;

export const ACCEPTED_MEDIA_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  ...ACCEPTED_VIDEO_TYPES,
] as const;
