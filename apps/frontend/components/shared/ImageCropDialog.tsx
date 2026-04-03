"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Data URL from FileReader */
  imageSrc: string;
  /** Aspect ratio as width / height. E.g. 1 for square, 3 for 3:1 banner */
  aspect: number;
  /** Localized title shown in the dialog header */
  title: string;
  /** Original file — used to derive the output filename and MIME type */
  originalFile: File;
  /** Previously selected crop area. */
  initialCrop?: Crop | null;
  /** Optional class override for dialog content (e.g. z-index). */
  contentClassName?: string;
  /** Optional class override for dialog overlay. */
  overlayClassName?: string;
  onCropComplete: (file: File, crop?: Crop) => void;
}

async function getCroppedFile(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  originalFile: File,
): Promise<File> {
  const canvas = document.createElement("canvas");
  const maxSize = 1024;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const naturalW = pixelCrop.width * scaleX;
  const naturalH = pixelCrop.height * scaleY;
  if (naturalW <= 0 || naturalH <= 0) {
    throw new Error("Invalid crop size");
  }
  const scale = Math.min(1, maxSize / Math.max(naturalW, naturalH));
  canvas.width = Math.max(1, Math.round(naturalW * scale));
  canvas.height = Math.max(1, Math.round(naturalH * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    naturalW,
    naturalH,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const outputMime =
    originalFile.type === "image/jpeg" ? "image/jpeg" : "image/png";
  const ext = outputMime === "image/jpeg" ? "jpg" : "png";
  const baseName = originalFile.name.replace(/\.[^.]+$/, "");

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        resolve(
          new File([blob], `${baseName}-cropped.${ext}`, { type: outputMime }),
        );
      },
      outputMime,
      0.92,
    );
  });
}

function makeDefaultCrop(aspect: number, width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 100 }, aspect, width, height),
    width,
    height,
  );
}

function toPixelCrop(crop: Crop, width: number, height: number): PixelCrop {
  if (crop.unit === "%") {
    return {
      unit: "px",
      x: Math.round((crop.x / 100) * width),
      y: Math.round((crop.y / 100) * height),
      width: Math.round((crop.width / 100) * width),
      height: Math.round((crop.height / 100) * height),
    };
  }

  return {
    unit: "px",
    x: Math.round(crop.x),
    y: Math.round(crop.y),
    width: Math.round(crop.width),
    height: Math.round(crop.height),
  };
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  aspect,
  title,
  originalFile,
  initialCrop,
  contentClassName,
  overlayClassName,
  onCropComplete,
}: ImageCropDialogProps) {
  const t = useTranslations("imageCrop");
  const imgRef = useRef<HTMLImageElement>(null);
  const imageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);

  const resetCropToDefault = useCallback(() => {
    if (!imageSizeRef.current) return;
    const { width, height } = imageSizeRef.current;
    const nextCrop = makeDefaultCrop(aspect, width, height);
    setCrop(nextCrop);
    setCompletedCrop(toPixelCrop(nextCrop, width, height));
  }, [aspect]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      imageSizeRef.current = { width, height };
      if (initialCrop && initialCrop.width > 0 && initialCrop.height > 0) {
        setCrop(initialCrop);
        setCompletedCrop(toPixelCrop(initialCrop, width, height));
        return;
      }
      const initial = makeDefaultCrop(aspect, width, height);
      setCrop(initial);
      setCompletedCrop(toPixelCrop(initial, width, height));
    },
    [aspect, initialCrop],
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = async () => {
    const hasValidCrop =
      !!completedCrop && completedCrop.width > 0 && completedCrop.height > 0;
    if (!hasValidCrop || !imgRef.current || !crop) return;
    setIsProcessing(true);
    try {
      const file = await getCroppedFile(
        imgRef.current,
        completedCrop,
        originalFile,
      );
      onCropComplete(file, crop);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName={cn("z-[60]", overlayClassName)}
        className={cn(
          `
          sm:max-w-xl
          gap-0
          p-0
          [&>button]:hidden
          sm:!top-6
          sm:!translate-y-0
          sm:m-6
          max-sm:!m-3
          max-sm:!top-0
          max-sm:!left-0
          max-sm:!right-0
          max-sm:!translate-x-0
          max-sm:!translate-y-0
          max-sm:!max-w-[calc(100vw-24px)]
          max-sm:!w-[calc(100vw-24px)]
          max-sm:rounded-xl
          max-sm:!max-h-[calc(100vh-24px)]
          max-sm:overflow-hidden
          `,
          contentClassName,
        )}
      >
        {/* Header */}
        <div className="pt-3 px-3 gap-3 pb-3 flex flex-row items-center justify-start shrink-0 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
            aria-label={t("cancel")}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
          <DialogTitle className="text-base font-semibold leading-none">
            {title}
          </DialogTitle>
        </div>

        {/* Crop area */}
        <div className="flex items-center justify-center bg-muted p-4 max-h-[60vh] overflow-hidden">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => {
              if (c.width <= 0 || c.height <= 0) {
                setCompletedCrop(undefined);
                return;
              }
              setCompletedCrop(c);
            }}
            aspect={aspect}
            circularCrop={false}
            className="max-h-[52vh]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={onImageLoad}
              onClick={resetCropToDefault}
              alt=""
              style={{ maxHeight: "52vh", maxWidth: "100%", display: "block" }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-border">
          <Button
            variant="default"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={
              isProcessing ||
              !completedCrop ||
              completedCrop.width <= 0 ||
              completedCrop.height <= 0
            }
          >
            {isProcessing ? t("processing") : t("apply")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
