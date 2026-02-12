/**
 * Constants for post composition
 */

export const MAX_CONTENT_LENGTH = 300;
export const MAX_IMAGES = 4;

// File size limit unified for all formats (increased from 10MB to 15MB)
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB per file

export const MAX_TEXTAREA_HEIGHT = 400; // px
export const CHARACTER_COUNT_THRESHOLD = 75; // Show count at 75%
export const WARNING_THRESHOLD = 90; // Yellow at 90%

// Added GIF support
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif", // Added animated GIF support
] as const;

