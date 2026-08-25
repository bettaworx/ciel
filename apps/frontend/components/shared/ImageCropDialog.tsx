"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, {
  type Crop,
  type PercentCrop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import { useTranslations } from "next-intl";
import { X, RotateCcw, FlipHorizontal2, BrushCleaning } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ASPECT_RATIO_OPTIONS,
  resolveAspect,
  type AspectRatioId,
} from "./image-crop/aspectRatios";
import {
  IDENTITY,
  buildTransformedImage,
  flipCropH,
  isIdentity,
  loadImage,
  nextRotateCCW,
  rotateCropCCW90,
  toggleFlipH,
  type Transform,
} from "./image-crop/transforms";
import { AspectRatioSelector } from "./image-crop/AspectRatioSelector";
import { ResetConfirm } from "./image-crop/ResetConfirm";

export type AspectMode =
  | { mode: "fixed"; aspect?: number }
  | { mode: "selectable"; defaultId?: AspectRatioId };

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Data URL from FileReader */
  imageSrc: string;
  /** Aspect-ratio behaviour: fixed (no selector) or user-selectable (selector visible). */
  aspectMode: AspectMode;
  /** Localized title shown in the dialog header */
  title: string;
  /** Original file — used to derive the output filename and MIME type */
  originalFile: File;
  /** Previously selected crop area (only honoured on initial mount, before any transform). */
  initialCrop?: Crop | null;
  /** Previously applied rotate/flip transformation. */
  initialTransform?: Transform | null;
  /** Previously selected aspect-ratio id (only used when aspectMode is "selectable"). */
  initialAspectId?: AspectRatioId | null;
  /** Optional class override for dialog content (e.g. z-index). */
  contentClassName?: string;
  /** Optional class override for dialog overlay. */
  overlayClassName?: string;
  /**
   * Longest edge of the cropped result, in pixels. Defaults to 1024. Raise it
   * when the server's own target is larger than that, or it upscales what it is
   * given and the difference is visible.
   */
  maxOutputSize?: number;
  onCropComplete: (
    file: File,
    crop?: Crop,
    transform?: Transform,
    aspectId?: AspectRatioId,
  ) => void;
}

async function getCroppedFile(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  originalFile: File,
  maxSize: number,
): Promise<File> {
  const canvas = document.createElement("canvas");
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

function makeDefaultCrop(
  aspect: number | undefined,
  width: number,
  height: number,
): PercentCrop {
  if (aspect === undefined) {
    return { unit: "%", x: 0, y: 0, width: 100, height: 100 };
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 100 }, aspect, width, height),
    width,
    height,
  ) as PercentCrop;
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

function isPercentCrop(crop: Crop | undefined): crop is PercentCrop {
  return !!crop && crop.unit === "%";
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  aspectMode,
  title,
  originalFile,
  initialCrop,
  initialTransform,
  initialAspectId,
  contentClassName,
  overlayClassName,
  maxOutputSize = 1024,
  onCropComplete,
}: ImageCropDialogProps) {
  const t = useTranslations("imageCrop");
  const imgRef = useRef<HTMLImageElement>(null);
  const imageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const initializedRef = useRef(false);
  const pendingResetRef = useRef(false);

  const defaultAspectId: AspectRatioId =
    aspectMode.mode === "selectable"
      ? (aspectMode.defaultId ?? "free")
      : "free";
  const startingAspectId: AspectRatioId =
    aspectMode.mode === "selectable"
      ? (initialAspectId ?? defaultAspectId)
      : defaultAspectId;
  const startingTransform: Transform = initialTransform ?? IDENTITY;

  const [selectedAspectId, setSelectedAspectId] =
    useState<AspectRatioId>(startingAspectId);
  const [transform, setTransform] = useState<Transform>(startingTransform);
  const [displaySrc, setDisplaySrc] = useState<string>(imageSrc);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const computeAspect = useCallback(
    (w: number, h: number): number | undefined => {
      if (aspectMode.mode === "fixed") return aspectMode.aspect;
      return resolveAspect(selectedAspectId, w, h);
    },
    [aspectMode, selectedAspectId],
  );

  const currentAspect: number | undefined = imageSizeRef.current
    ? computeAspect(
        imageSizeRef.current.width,
        imageSizeRef.current.height,
      )
    : aspectMode.mode === "fixed"
      ? aspectMode.aspect
      : undefined;

  useEffect(() => {
    let cancelled = false;
    initializedRef.current = false;
    originalImgRef.current = null;
    setDisplaySrc(imageSrc);
    loadImage(imageSrc)
      .then((img) => {
        if (cancelled) return;
        originalImgRef.current = img;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  // Only URLs built here may be revoked; imageSrc belongs to the caller.
  const transformedUrlRef = useRef<string | null>(null);
  const showTransformed = useCallback((url: string | null) => {
    if (transformedUrlRef.current) URL.revokeObjectURL(transformedUrlRef.current);
    transformedUrlRef.current = url;
  }, []);

  useEffect(
    () => () => {
      if (transformedUrlRef.current) URL.revokeObjectURL(transformedUrlRef.current);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    if (isIdentity(transform)) {
      showTransformed(null);
      setDisplaySrc(imageSrc);
      return () => {
        cancelled = true;
      };
    }
    setIsTransforming(true);
    const run = async () => {
      let orig = originalImgRef.current;
      if (!orig) {
        try {
          orig = await loadImage(imageSrc);
          if (cancelled) return;
          originalImgRef.current = orig;
        } catch {
          if (!cancelled) setIsTransforming(false);
          return;
        }
      }
      try {
        const { url } = await buildTransformedImage(orig, transform);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        showTransformed(url);
        setDisplaySrc(url);
      } finally {
        if (!cancelled) setIsTransforming(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [transform, imageSrc, showTransformed]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      const naturalW = target.naturalWidth;
      const naturalH = target.naturalHeight;
      const clientW = target.clientWidth || naturalW;
      const clientH = target.clientHeight || naturalH;
      imageSizeRef.current = { width: naturalW, height: naturalH };

      if (pendingResetRef.current) {
        pendingResetRef.current = false;
        initializedRef.current = true;
        const aspect = computeAspect(naturalW, naturalH);
        const initial = makeDefaultCrop(aspect, naturalW, naturalH);
        setCrop(initial);
        setCompletedCrop(toPixelCrop(initial, clientW, clientH));
        return;
      }

      if (isPercentCrop(crop)) {
        setCompletedCrop(toPixelCrop(crop, clientW, clientH));
        return;
      }

      if (
        !initializedRef.current &&
        initialCrop &&
        initialCrop.width > 0 &&
        initialCrop.height > 0
      ) {
        initializedRef.current = true;
        setCrop(initialCrop);
        setCompletedCrop(toPixelCrop(initialCrop, clientW, clientH));
        return;
      }

      initializedRef.current = true;
      const aspect = computeAspect(naturalW, naturalH);
      const initial = makeDefaultCrop(aspect, naturalW, naturalH);
      setCrop(initial);
      setCompletedCrop(toPixelCrop(initial, clientW, clientH));
    },
    [computeAspect, crop, initialCrop],
  );

  const handleRotate = () => {
    setTransform((prev) => nextRotateCCW(prev));
    const isAspectLocked =
      aspectMode.mode === "fixed" ||
      (aspectMode.mode === "selectable" && selectedAspectId !== "free");
    if (isAspectLocked) {
      // Locked aspect: don't rotate the crop rectangle with the image. Let
      // onImageLoad re-center a fresh default crop using the rotated dimensions.
      pendingResetRef.current = true;
    } else {
      setCrop((prev) => (isPercentCrop(prev) ? rotateCropCCW90(prev) : prev));
    }
    imageSizeRef.current = null;
    setCompletedCrop(undefined);
    setHasChanges(true);
  };

  const handleFlipH = () => {
    setTransform((prev) => toggleFlipH(prev));
    setCrop((prev) => (isPercentCrop(prev) ? flipCropH(prev) : prev));
    setCompletedCrop(undefined);
    setHasChanges(true);
  };

  const handleAspectChange = (id: AspectRatioId) => {
    setSelectedAspectId(id);
    setHasChanges(true);
    const size = imageSizeRef.current;
    const img = imgRef.current;
    if (!size || !img) return;
    const ratio =
      ASPECT_RATIO_OPTIONS.find((o) => o.id === id)?.ratio ?? "free";
    const aspect =
      ratio === "free"
        ? undefined
        : ratio === "original"
          ? size.width / size.height
          : ratio;
    if (id === "free" && isPercentCrop(crop)) {
      // keep current crop, just unlock aspect
      return;
    }
    const clientW = img.clientWidth || size.width;
    const clientH = img.clientHeight || size.height;
    const next = makeDefaultCrop(aspect, size.width, size.height);
    setCrop(next);
    setCompletedCrop(toPixelCrop(next, clientW, clientH));
  };

  const handleResetAll = () => {
    const wasIdentity = isIdentity(transform);
    setTransform(IDENTITY);
    setSelectedAspectId(defaultAspectId);
    setHasChanges(false);
    setResetConfirmOpen(false);

    if (wasIdentity) {
      // No image reload will be triggered (transform unchanged), so re-seed the
      // crop right away from the currently displayed image.
      const img = imgRef.current;
      const size = imageSizeRef.current;
      if (img && size) {
        const aspect =
          aspectMode.mode === "fixed"
            ? aspectMode.aspect
            : resolveAspect(defaultAspectId, size.width, size.height);
        const next = makeDefaultCrop(aspect, size.width, size.height);
        const clientW = img.clientWidth || size.width;
        const clientH = img.clientHeight || size.height;
        setCrop(next);
        setCompletedCrop(toPixelCrop(next, clientW, clientH));
      }
    } else {
      // Transform is changing → image will reload. Defer crop re-seed to onImageLoad
      // so it uses the post-reload natural dimensions, and ensure initialCrop is ignored.
      pendingResetRef.current = true;
      setCompletedCrop(undefined);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      setTransform(IDENTITY);
      setHasChanges(false);
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
        maxOutputSize,
      );
      onCropComplete(file, crop, transform, selectedAspectId);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const showAspectSelector = aspectMode.mode === "selectable";
  const isBusy = isProcessing || isTransforming;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName={cn("z-[60]", overlayClassName)}
        className={cn(
          `
          z-[70]
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
        <div className="pt-3 px-3 gap-2 pb-3 flex flex-row items-center shrink-0 border-b border-border">
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
          <DialogTitle className="text-base font-semibold leading-none flex-1 truncate">
            {title}
          </DialogTitle>
          <Button
            variant="primary"
            type="button"
            onClick={handleConfirm}
            disabled={
              isBusy ||
              !completedCrop ||
              completedCrop.width <= 0 ||
              completedCrop.height <= 0
            }
            className="h-8"
          >
            {isProcessing ? t("processing") : t("apply")}
          </Button>
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
              setHasChanges(true);
            }}
            aspect={currentAspect}
            circularCrop={false}
            className="max-h-[52vh]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={displaySrc}
              onLoad={onImageLoad}
              alt=""
              style={{ maxHeight: "52vh", maxWidth: "100%", display: "block" }}
            />
          </ReactCrop>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start gap-1 p-3 border-t border-border">
          {showAspectSelector && (
            <AspectRatioSelector
              value={selectedAspectId}
              onChange={handleAspectChange}
              disabled={isBusy}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleRotate}
            disabled={isBusy}
            aria-label={t("rotate")}
            className="h-8 w-8"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleFlipH}
            disabled={isBusy}
            aria-label={t("flipHorizontal")}
            className="h-8 w-8"
          >
            <FlipHorizontal2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            disabled={isBusy || !hasChanges}
            aria-label={t("resetConfirm.trigger")}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:!text-muted-foreground"
          >
            <BrushCleaning className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
      <ResetConfirm
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        onConfirm={handleResetAll}
      />
    </Dialog>
  );
}
