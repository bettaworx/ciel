"use client";

import { useState } from "react";
import { getSpotifyEmbedUrl, parseSpotifyUrl } from "@/lib/ogp/spotify";

interface SpotifyEmbedProps {
  url: string;
}

export function SpotifyEmbed({ url }: SpotifyEmbedProps) {
  const [hasError, setHasError] = useState(false);

  const parsed = parseSpotifyUrl(url);
  if (!parsed || hasError) return null;

  const height = parsed.type === "track" ? 152 : 352;

  return (
    <div className="mb-3 rounded-xl border border-border overflow-hidden">
      <iframe
        src={getSpotifyEmbedUrl(parsed)}
        width="100%"
        height={height}
        frameBorder="0"
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        title="Spotify embed"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
