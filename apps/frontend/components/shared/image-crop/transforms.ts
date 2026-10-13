import type { PercentCrop } from "react-image-crop";

export type Rotation = 0 | 90 | 180 | 270;

export interface Transform {
  rotation: Rotation;
  flipH: boolean;
}

export const IDENTITY: Transform = { rotation: 0, flipH: false };

export function isIdentity(t: Transform): boolean {
  return t.rotation === 0 && !t.flipH;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export interface TransformedImage {
  /** Object URL — revoke it once it has been replaced. */
  url: string;
  width: number;
  height: number;
}

/**
 * iOS Safari refuses to back a canvas larger than this, and does it silently:
 * the canvas stays blank and toBlob/toDataURL hand back nothing usable. A 48MP
 * iPhone photo is well past it.
 */
const MAX_CANVAS_PIXELS = 16_777_216;

/**
 * Render the rotate/flip preview.
 *
 * The result feeds the crop UI, and the crop is re-derived from the displayed
 * image's natural size, so clamping here costs nothing downstream. It also hands
 * back an object URL rather than a data URL: at full resolution the base64 of a
 * phone photo runs to tens of megabytes of string.
 */
export async function buildTransformedImage(
  originalImg: HTMLImageElement,
  transform: Transform,
  mimeType: string = "image/png",
): Promise<TransformedImage> {
  const W = originalImg.naturalWidth;
  const H = originalImg.naturalHeight;
  const rotated90 = transform.rotation === 90 || transform.rotation === 270;
  const scale = Math.min(1, Math.sqrt(MAX_CANVAS_PIXELS / (W * H)));
  const drawW = Math.max(1, Math.round(W * scale));
  const drawH = Math.max(1, Math.round(H * scale));
  const canvasW = rotated90 ? drawH : drawW;
  const canvasH = rotated90 ? drawW : drawH;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  if (transform.flipH) ctx.scale(-1, 1);
  ctx.rotate((-transform.rotation * Math.PI) / 180);
  ctx.drawImage(originalImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  const outputMime = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputMime, 0.95),
  );
  if (!blob) throw new Error("Canvas toBlob failed");
  return { url: URL.createObjectURL(blob), width: canvasW, height: canvasH };
}

export function rotateCropCCW90(crop: PercentCrop): PercentCrop {
  return {
    unit: "%",
    x: crop.y,
    y: 100 - crop.x - crop.width,
    width: crop.height,
    height: crop.width,
  };
}

export function flipCropH(crop: PercentCrop): PercentCrop {
  return {
    unit: "%",
    x: 100 - crop.x - crop.width,
    y: crop.y,
    width: crop.width,
    height: crop.height,
  };
}

/**
 * Compute the next transform when the user clicks the rotate-CCW button on the
 * currently displayed image. Because the displayed image is built as
 * F^k ∘ R_θ applied to the original, applying a visual CCW rotation to the
 * display rotates θ in the opposite direction when a flip is active
 * (since rotate90 ∘ flip = flip ∘ rotate-90).
 */
export function nextRotateCCW(t: Transform): Transform {
  const delta = t.flipH ? 270 : 90;
  return { ...t, rotation: ((t.rotation + delta) % 360) as Rotation };
}

export function toggleFlipH(t: Transform): Transform {
  return { ...t, flipH: !t.flipH };
}
