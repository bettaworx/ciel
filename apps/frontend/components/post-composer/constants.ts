/**
 * Constants for post composition
 */

export const MAX_CONTENT_LENGTH = 1000;
/** Attachments per post, images and videos in any mix. Mirrors maxPostMedia in the backend. */
export const MAX_MEDIA = 20;

// Note: File size limit is now dynamically fetched from server-info API
// See useMediaLimits() hook in @/lib/hooks/use-queries

export const MAX_TEXTAREA_HEIGHT = 400; // px
export const CHARACTER_COUNT_THRESHOLD = 50; // Show count at 50%
export const WARNING_THRESHOLD = 90; // Yellow at 90%

// Anything the browser can decode is accepted: lib/media/normalize.ts converts
// every import into WebP or WebM before it is uploaded.
export const ACCEPTED_MEDIA_ACCEPT = "image/*,video/*";

// Guards on the *raw* import, before normalization. The server-side limits apply
// to the normalized result, so checking them here would reject a 60 MB PNG that
// becomes a 300 KB WebP. Oversized normalized uploads are caught by the 413 handler.
export const MAX_RAW_IMAGE_BYTES = 256 * 1024 * 1024;
export const MAX_RAW_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
