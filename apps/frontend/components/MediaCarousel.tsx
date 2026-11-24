"use client";

import { type ReactNode, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { WheelNotchPlugin } from "@/lib/media/wheel-notch";
import { cn } from "@/lib/utils";

interface MediaCarouselProps {
  /** Slides; each sizes itself from the track height and its aspect ratio. */
  children: ReactNode;
  className?: string;
  /** CSS length capping the track height (the slides follow it), e.g. inside the composer dialog. */
  maxHeight?: string;
  /**
   * A slide to bring to rest; null leaves the carousel where it is. The card
   * passes the item its lightbox has open, so the carousel follows the
   * lightbox from the moment it opens and through every move inside it.
   */
  focusIndex?: number | null;
}

/**
 * Horizontal strip for five or more attachments, on Embla.
 *
 * Swipe, mouse drag, a trackpad (WheelGesturesPlugin, which releases on its
 * momentum), mouse-wheel notches (WheelNotchPlugin, one slide each) and the
 * arrow buttons all move it, and it settles with a slide centred. `trimSnaps` drops the
 * snap points that would leave empty track at either end, so the first slide
 * rests flush left and the last flush right instead of being pulled to the
 * middle.
 */
export function MediaCarousel({ children, className, maxHeight, focusIndex }: MediaCarouselProps) {
  const t = useTranslations("mediaCarousel");
  // skipSnaps: a long scroll or a strong flick may carry past several slides.
  const [viewportRef, api] = useEmblaCarousel(
    { align: "center", containScroll: "trimSnaps", skipSnaps: true },
    [WheelNotchPlugin(), WheelGesturesPlugin()],
  );
  const [edges, setEdges] = useState({ canPrev: false, canNext: false });

  useEffect(() => {
    if (!api) return;
    const update = () => setEdges({ canPrev: api.canScrollPrev(), canNext: api.canScrollNext() });
    update();
    api.on("select", update).on("reInit", update);
    return () => {
      api.off("select", update).off("reInit", update);
    };
  }, [api]);

  useEffect(() => {
    if (!api || focusIndex == null) return;
    // Snaps, not slides: slides sharing a trimmed snap at an end rest together.
    const snap = api
      .internalEngine()
      .slideRegistry.findIndex((slides) => slides.includes(focusIndex));
    if (snap >= 0) api.scrollTo(snap);
  }, [api, focusIndex]);

  return (
    <div className={cn("relative", className)}>
      {/* Rounded and clipping, so a slide cut off by either edge mid-move
          keeps a rounded corner there instead of a square one. */}
      <div ref={viewportRef} className="overflow-hidden rounded-xl">
        <div
          data-media-carousel=""
          className="flex h-56 gap-1 sm:h-72"
          style={maxHeight ? { maxHeight } : undefined}
        >
          {children}
        </div>
      </div>
      {edges.canPrev && (
        <ArrowButton side="left" label={t("previous")} onClick={() => api?.scrollPrev()} />
      )}
      {edges.canNext && (
        <ArrowButton side="right" label={t("next")} onClick={() => api?.scrollNext()} />
      )}
    </div>
  );
}

function ArrowButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => {
        // The card behind opens the post on click.
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60 sm:p-2",
        side === "left" ? "left-2" : "right-2",
      )}
      aria-label={label}
    >
      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );
}
