const DEFAULT_SIZE = 400;
const DEFAULT_FILENAME = "avatar.png";

export async function rasterizeSvgToFile(
  svgDataUri: string,
  options?: { size?: number; filename?: string },
): Promise<File> {
  const size = options?.size ?? DEFAULT_SIZE;
  const filename = options?.filename ?? DEFAULT_FILENAME;

  const img = await loadImage(svgDataUri);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2d context");

  ctx.drawImage(img, 0, 0, size, size);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/png",
    );
  });

  return new File([blob], filename, { type: "image/png" });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
