"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { carouselEdges, carouselSnapPoints, carouselStepTarget } from "@/lib/media/layout";
import { createNotchDetector } from "@/lib/media/wheel-notch";
import { cn } from "@/lib/utils";

interface MediaCarouselProps {
  /**
   * Slides, as direct children; each sizes itself from the track height and
   * its aspect ratio, and carries `snap-center`.
   */
  children: ReactNode;
  className?: string;
  /** CSS length capping the track height (the slides follow it), e.g. inside the composer dialog. */
  maxHeight?: string;
  /**
   * A slide to bring to rest, centred; null leaves the track where it is. The
   * card passes the slide its lightbox is showing, so the carousel follows the
   * lightbox from the moment it opens and through every move inside it.
   */
  focusIndex?: number | null;
}

/** Where the track rests for each slide; see carouselSnapPoints. */
function snapPointsOf(track: HTMLElement) {
  // The track is `relative`, so offsetLeft is a slide's start in scroll coordinates.
  const slides = Array.from(track.children as HTMLCollectionOf<HTMLElement>, (slide) => ({
    start: slide.offsetLeft,
    width: slide.offsetWidth,
  }));
  return carouselSnapPoints(slides, track.clientWidth, track.scrollWidth - track.clientWidth);
}

/**
 * Horizontal strip for five or more attachments.
 *
 * Swipe and horizontal scrolling are the browser's own overflow scrolling, and
 * CSS scroll snapping settles every gesture with a slide centred. The browser
 * clamps snap positions to the scroll range and the track is not padded, so
 * the first slide rests flush left and the last flush right instead of being
 * pulled to the middle. The arrow buttons step one slide at a time to the same
 * positions (carouselSnapPoints, carouselStepTarget).
 */
export function MediaCarousel({ children, className, maxHeight, focusIndex }: MediaCarouselProps) {
  const t = useTranslations("mediaCarousel");
  const trackRef = useRef<HTMLDivElement>(null);
  /** Where an arrow-started smooth scroll is headed, until it gets there. */
  const pendingRef = useRef<number | null>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const next = carouselEdges(track.scrollLeft, track.scrollWidth - track.clientWidth);
    setEdges((prev) => (prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next));
  }, []);

  // After every render, since slides may have been added or removed (composer).
  useEffect(() => {
    updateEdges();
  });

  // When the card changes width, and when any scroll settles: a swipe that
  // interrupts an arrow step must not leave its target behind.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    const settled = () => {
      pendingRef.current = null;
      updateEdges();
    };
    track.addEventListener("scrollend", settled);
    return () => {
      observer.disconnect();
      track.removeEventListener("scrollend", settled);
    };
  }, [updateEdges]);

  const handleScroll = () => {
    const track = trackRef.current;
    // Arrival also ends a step, for browsers without `scrollend`.
    if (
      track &&
      pendingRef.current !== null &&
      Math.abs(track.scrollLeft - pendingRef.current) < 1
    ) {
      pendingRef.current = null;
    }
    updateEdges();
  };

  /** Smooth-scroll to `left`, remembering it until the track gets there. */
  const scrollToPoint = useCallback((left: number) => {
    const track = trackRef.current;
    if (!track) return;
    pendingRef.current = left;
    track.scrollTo({ left, behavior: "smooth" });
  }, []);

  // A trackpad scrolls the track natively. A mouse wheel's notch would only
  // be snapped back to the slide it started from, so it steps one slide like
  // an arrow does (see lib/media/wheel-notch.ts).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const isNotch = createNotchDetector();
    const onWheel = (event: WheelEvent) => {
      const dx = event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX;
      if (Math.abs(dx) <= Math.abs(event.deltaY) || !isNotch(dx, event.timeStamp)) return;
      event.preventDefault();
      const from = pendingRef.current ?? track.scrollLeft;
      scrollToPoint(carouselStepTarget(snapPointsOf(track), from, dx > 0 ? 1 : -1));
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, [scrollToPoint]);

  const step = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // Count from the step still in flight, so every press moves one more slide.
    const from = pendingRef.current ?? track.scrollLeft;
    scrollToPoint(carouselStepTarget(snapPointsOf(track), from, direction));
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || focusIndex == null) return;
    const target = snapPointsOf(track)[focusIndex];
    if (target !== undefined) scrollToPoint(target);
  }, [focusIndex, scrollToPoint]);

  return (
    <div className={cn("relative", className)}>
      {/* Rounded and clipping, so a slide cut off by either edge mid-scroll
          keeps a rounded corner there instead of a square one. */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        data-media-carousel=""
        className="relative flex h-56 gap-1 overflow-x-auto overscroll-x-contain rounded-xl snap-x snap-mandatory [scrollbar-width:none] sm:h-72 [&::-webkit-scrollbar]:hidden"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
      {!edges.atStart && <ArrowButton side="left" label={t("previous")} onClick={() => step(-1)} />}
      {!edges.atEnd && <ArrowButton side="right" label={t("next")} onClick={() => step(1)} />}
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
