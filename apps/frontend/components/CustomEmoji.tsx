"use client";

import { useState } from "react";
import { useCustomEmojis } from "@/lib/hooks/use-queries";
import {
  formatCustomEmojiFallback,
  isCustomEmojiShortcode,
  normalizeCustomEmojiShortcode,
  resolveCustomEmoji,
} from "@/lib/custom-emojis";
import { cn } from "@/lib/utils";

interface CustomEmojiProps {
  shortcode: string;
  className?: string;
}

export function CustomEmoji({ shortcode, className }: CustomEmojiProps) {
  const { data: emojis, isLoading } = useCustomEmojis();
  const [failed, setFailed] = useState(false);
  const fallback = formatCustomEmojiFallback(shortcode);
  const normalized = normalizeCustomEmojiShortcode(shortcode);
  const emoji = failed ? undefined : resolveCustomEmoji(emojis, shortcode);
  const shouldHideWhileLoading =
    !failed &&
    isLoading &&
    isCustomEmojiShortcode(shortcode) &&
    !normalized.includes("@");

  if (shouldHideWhileLoading) {
    return (
      <span
        className={cn("mfm-inline-emoji", "mfm-custom-emoji-placeholder", className)}
        aria-hidden="true"
      />
    );
  }

  if (!emoji?.imageUrl) {
    return (
      <span className={cn("mfm-inline-emoji", "mfm-emoji-code", className)}>
        {fallback}
      </span>
    );
  }

  return (
    <span className={cn("mfm-inline-emoji", className)}>
      <img
        src={emoji.imageUrl}
        alt={fallback}
        title={emoji.name ?? fallback}
        loading="lazy"
        decoding="async"
        className="mfm-custom-emoji-image"
        onError={() => setFailed(true)}
        data-shortcode={normalized}
      />
    </span>
  );
}
