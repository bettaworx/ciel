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
      // Named group: the wrapper already owns `group` for the remove button.
      // The gap lives here rather than on the label so that p-2 stays symmetric:
      // collapsed it is the same circle as the remove button, expanded it is a
      // pill with the same padding at both ends. It uses plain `hover:` — a
      // `group-hover/conv:` variant is a descendant selector and would never
      // match the group element itself.
      //
      // Touch layouts have no hover, so below `sm` the label is simply always
      // out — the same treatment RemoveButton gives itself.
      className={`group/conv ${shell} gap-1.5 transition-all duration-200 ease-out sm:gap-0 sm:hover:gap-1.5`}
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
      {/*
        max-width rather than width so the label animates without a fixed size.
        leading-none keeps the collapsed disc square: an inherited line-height
        taller than the 14px ring would stretch the box into an ellipse.
      */}
      <span
        aria-hidden
        className="max-w-12 overflow-hidden whitespace-nowrap text-[11px] font-medium leading-none tabular-nums opacity-100 transition-all duration-200 ease-out sm:max-w-0 sm:opacity-0 sm:group-hover/conv:max-w-12 sm:group-hover/conv:opacity-100"
      >
        {percent}%
      </span>
    </div>
  );
}
