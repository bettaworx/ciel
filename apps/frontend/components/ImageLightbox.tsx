"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
}

const clampIndex = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ImageLightbox({
  images,
  open,
  onOpenChange,
  initialIndex = 0,
}: ImageLightboxProps) {
  const t = useTranslations("lightbox");
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const maxIndex = useMemo(
    () => Math.max(0, images.length - 1),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    if (images.length === 0) {
      onOpenChange(false);
      return;
    }
    setCurrentIndex(clampIndex(initialIndex, 0, maxIndex));
    setIsZoomed(false);
  }, [open, images.length, initialIndex, maxIndex, onOpenChange]);

  const centerScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const maxLeft = container.scrollWidth - container.clientWidth;
    const maxTop = container.scrollHeight - container.clientHeight;
    container.scrollLeft = maxLeft > 0 ? maxLeft / 2 : 0;
    container.scrollTop = maxTop > 0 ? maxTop / 2 : 0;
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(centerScroll);
    return () => window.cancelAnimationFrame(id);
  }, [open, isZoomed, currentIndex, centerScroll]);

  useEffect(() => {
    setCurrentIndex((prev) => clampIndex(prev, 0, maxIndex));
  }, [maxIndex]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < maxIndex;

  const handlePrev = useCallback(() => {
    if (!hasPrev) return;
    setCurrentIndex((prev) => clampIndex(prev - 1, 0, maxIndex));
    setIsZoomed(false);
  }, [hasPrev, maxIndex]);

  const handleNext = useCallback(() => {
    if (!hasNext) return;
    setCurrentIndex((prev) => clampIndex(prev + 1, 0, maxIndex));
    setIsZoomed(false);
  }, [hasNext, maxIndex]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePrev();
      }
      if (event.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext]);

  const currentImage = images[currentIndex];

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !inset-0 !h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-transparent !p-0 [&>button]:hidden">
        <div className="relative h-full w-full bg-black/25">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-20 h-9 w-9 bg-background/70 hover:bg-background"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>

          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={!hasPrev}
                className="absolute left-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 bg-background/70 hover:bg-background"
                aria-label={t("previous")}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={!hasNext}
                className="absolute right-3 top-1/2 z-20 h-10 w-10 -translate-y-1/2 bg-background/70 hover:bg-background"
                aria-label={t("next")}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-auto touch-pan-x touch-pan-y overscroll-contain"
          >
            <div
              className={cn(
                "min-h-full min-w-full p-6 flex items-center justify-center",
                isZoomed
                  ? "min-h-[200%] min-w-[200%] cursor-grab active:cursor-grabbing"
                  : "cursor-zoom-in",
              )}
            >
              {currentImage && (
                <button
                  type="button"
                  onClick={() => setIsZoomed((prev) => !prev)}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={isZoomed ? t("zoomOut") : t("zoomIn")}
                >
                  <img
                    src={currentImage.src}
                    alt={currentImage.alt || t("imageAlt")}
                    draggable={false}
                    className={cn(
                      "select-none object-contain transition-transform duration-200 ease-out origin-center",
                      isZoomed
                        ? "max-h-none max-w-none scale-[2]"
                        : "max-h-[calc(100vh-48px)] max-w-[calc(100vw-48px)]",
                    )}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
