/**
 * Constants for post composition
 */

export const MAX_CONTENT_LENGTH = 300;
export const MAX_IMAGES = 4;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
export const MAX_TEXTAREA_HEIGHT = 400; // px
export const CHARACTER_COUNT_THRESHOLD = 75; // Show count at 75%
export const WARNING_THRESHOLD = 90; // Yellow at 90%
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;
