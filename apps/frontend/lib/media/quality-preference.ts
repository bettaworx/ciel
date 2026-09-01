import {
  DEFAULT_IMAGE_MODE,
  DEFAULT_VIDEO_MODE,
  type ImageQualityMode,
  type VideoQualityMode,
} from "@/lib/media/normalize";

/**
 * The compression mode last chosen for each kind of attachment, so the next post
 * starts where the poster left off rather than back at the default.
 */
const KEYS = {
  image: "ciel:media-quality:image",
  video: "ciel:media-quality:video",
} as const;

const VALID: Record<"image" | "video", ReadonlyArray<string>> = {
  image: ["none", "dot-by-dot", "performance", "balance", "quality"],
  video: ["none", "performance", "balance", "quality"],
};

type ModeFor<K> = K extends "video" ? VideoQualityMode : ImageQualityMode;

/**
 * The remembered mode, or the default. `allowNone` is false while the file
 * cannot be uploaded untouched, so a remembered 'none' does not silently pick a
 * mode the file is not eligible for.
 */
export function loadQualityMode<K extends "image" | "video">(
  kind: K,
  allowNone: boolean,
): ModeFor<K> {
  const fallback = (
    kind === "video" ? DEFAULT_VIDEO_MODE : DEFAULT_IMAGE_MODE
  ) as ModeFor<K>;

  if (typeof window === "undefined") return fallback;

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(KEYS[kind]);
  } catch {
    // Private mode and blocked storage both throw; the default is fine.
    return fallback;
  }

  if (!stored || !VALID[kind].includes(stored)) return fallback;
  if (stored === "none" && !allowNone) return fallback;
  return stored as ModeFor<K>;
}

export function saveQualityMode(kind: "image" | "video", mode: string): void {
  try {
    window.localStorage.setItem(KEYS[kind], mode);
  } catch {
    // Not being able to remember the choice is not worth failing an upload over.
  }
}
