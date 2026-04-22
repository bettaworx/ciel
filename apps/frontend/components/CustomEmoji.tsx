"use client";

import { useState } from "react";
import { useCustomEmojis } from "@/lib/hooks/use-queries";
import {
  formatCustomEmojiFallback,
  normalizeCustomEmojiShortcode,
  resolveCustomEmoji,
} from "@/lib/custom-emojis";
import { cn } from "@/lib/utils";

interface CustomEmojiProps {
  shortcode: string;
  className?: string;
}

export function CustomEmoji({ shortcode, className }: CustomEmojiProps) {
  const { data: emojis } = useCustomEmojis();
  const [failed, setFailed] = useState(false);
  const fallback = formatCustomEmojiFallback(shortcode);
  const normalized = normalizeCustomEmojiShortcode(shortcode);
  const emoji = failed ? undefined : resolveCustomEmoji(emojis, shortcode);

  if (!emoji?.imageUrl) {
    return <span className={cn("mfm-emoji-code", className)}>{fallback}</span>;
  }

  return (
    <img
      src={emoji.imageUrl}
      alt={fallback}
      title={emoji.name ?? fallback}
      loading="lazy"
      decoding="async"
      className={cn(
        "inline-block h-[1.25em] w-auto align-[-0.2em]",
        className,
      )}
      onError={() => setFailed(true)}
      data-shortcode={normalized}
    />
  );
}
