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
  dataUrl: string;
  width: number;
  height: number;
}

export async function buildTransformedImage(
  originalImg: HTMLImageElement,
  transform: Transform,
  mimeType: string = "image/png",
): Promise<TransformedImage> {
  const W = originalImg.naturalWidth;
  const H = originalImg.naturalHeight;
  const rotated90 = transform.rotation === 90 || transform.rotation === 270;
  const canvasW = rotated90 ? H : W;
  const canvasH = rotated90 ? W : H;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.save();
  ctx.translate(canvasW / 2, canvasH / 2);
  if (transform.flipH) ctx.scale(-1, 1);
  ctx.rotate((-transform.rotation * Math.PI) / 180);
  ctx.drawImage(originalImg, -W / 2, -H / 2);
  ctx.restore();

  const outputMime = mimeType === "image/jpeg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(outputMime, 0.95);
  return { dataUrl, width: canvasW, height: canvasH };
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
