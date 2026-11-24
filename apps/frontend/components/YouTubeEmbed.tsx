"use client";

import { useState } from "react";
import { getYoutubeEmbedUrl, parseYoutubeUrl } from "@/lib/ogp/youtube";

interface YouTubeEmbedProps {
  url: string;
}

export function YouTubeEmbed({ url }: YouTubeEmbedProps) {
  const [hasError, setHasError] = useState(false);

  const parsed = parseYoutubeUrl(url);
  if (!parsed || hasError) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="relative w-full aspect-video bg-muted">
        <iframe
          src={getYoutubeEmbedUrl(parsed.videoId)}
          className="absolute inset-0 w-full h-full border-0"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}
