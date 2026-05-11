import { decode, isBlurhashValid } from "blurhash";

// Small enough to keep the synchronous decode cheap and the data URL short,
// large enough to avoid pixelation when the placeholder is upscaled by
// `object-cover`. 32 is the common pick for next/image-style placeholders.
const PLACEHOLDER_SIZE = 32;

const cache = new Map<string, string>();

function blurhashToDataUrl(hash: string): string | null {
  if (typeof document === "undefined") return null;
  if (!isBlurhashValid(hash).result) return null;

  const cached = cache.get(hash);
  if (cached) return cached;

  let pixels: Uint8ClampedArray;
  try {
    pixels = decode(hash, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE);
  } catch {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = PLACEHOLDER_SIZE;
  canvas.height = PLACEHOLDER_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imageData = ctx.createImageData(PLACEHOLDER_SIZE, PLACEHOLDER_SIZE);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);

  const dataUrl = canvas.toDataURL("image/png");
  cache.set(hash, dataUrl);
  return dataUrl;
}

export function getBlurhashDataUrl(hash: string | null | undefined): string | null {
  if (!hash) return null;
  return blurhashToDataUrl(hash);
}
