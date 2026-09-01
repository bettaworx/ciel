"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

interface MediaConversionIndicatorProps {
  /** 0-1. Reaching 1 switches the indicator to its finished state. */
  progress: number;
}

/**
 * Conversion state overlaid on a media item in the composer.
 *
 * Sits at the top-left of the preview, opposite the remove button, and stays
 * visible rather than appearing on hover: that a video is still converting is
 * the reason the post button is disabled, so it has to be readable at a glance.
 * Hovering slides the exact percentage out to the right of the ring.
 *
 * Uses the same SVG ring technique as CharacterCounter, on the same translucent
 * disc as RemoveButton so it reads against any frame of the video.
 */
export function MediaConversionIndicator({
  progress,
}: MediaConversionIndicatorProps) {
  const t = useTranslations("createPost");
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  const done = percent >= 100;

  // Same disc as RemoveButton: bg-black/40, rounded-full, p-2 on every side.
  const shell =
    "absolute top-2 left-2 z-10 flex items-center rounded-full bg-black/40 p-2 text-white";

  if (done) {
    return (
      <div role="status" aria-label={t("conversionComplete")} className={shell}>
        <Check className="w-3.5 h-3.5 shrink-0" />
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-label={t("converting")}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      // The percentage is the whole point of the indicator, so it is always out
      // rather than waiting on a hover that touch layouts cannot deliver.
      className={`${shell} gap-1.5`}
    >
      <svg className="w-3.5 h-3.5 shrink-0 -rotate-90" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r={radius}
          className="fill-none stroke-white/30"
          strokeWidth="3"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          className="fill-none stroke-white transition-all duration-300"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          strokeLinecap="round"
        />
      </svg>
      {/* leading-none keeps the row as tall as the ring, not as the text box. */}
      <span
        aria-hidden
        className="whitespace-nowrap text-[11px] font-medium leading-none tabular-nums"
      >
        {percent}%
      </span>
    </div>
  );
}
