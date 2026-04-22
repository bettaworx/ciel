"use client";

import { CustomEmoji } from "@/components/CustomEmoji";
import { Twemoji } from "@/components/Twemoji";
import { isCustomEmojiShortcode } from "@/lib/custom-emojis";

interface EmojiInlineProps {
  emoji: string;
  className?: string;
}

export function EmojiInline({ emoji, className }: EmojiInlineProps) {
  if (isCustomEmojiShortcode(emoji)) {
    return <CustomEmoji shortcode={emoji} className={className} />;
  }

  return <Twemoji emoji={emoji} className={className} />;
}
