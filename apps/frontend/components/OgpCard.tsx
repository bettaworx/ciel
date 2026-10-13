"use client";

import { Spinner } from "@/components/ui/spinner";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TwitterEmbed } from "@/components/TwitterEmbed";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { resolveApiBaseUrl } from "@/lib/api/base-url";
import { useOgp } from "@/lib/hooks/use-queries";
import { parseSpotifyUrl } from "@/lib/ogp/spotify";
import { parseTwitterUrl } from "@/lib/ogp/twitter";
import { parseYoutubeUrl } from "@/lib/ogp/youtube";
import { ExternalLink } from "lucide-react";

export type OgpCardVariant = "timeline" | "detail";

interface OgpCardProps {
  url: string;
  variant: OgpCardVariant;
}

/**
 * Displays a link preview.
 *
 * - Spotify and YouTube are always rendered as rich embeds.
 * - X (Twitter) is rendered as a rich embed only in detail view; in the timeline
 *   it falls back to a regular OGP card to avoid loading third-party scripts on
 *   every row.
 * - Other URLs always use the OGP card.
 *
 * Two layout modes, chosen by `variant`:
 *
 * **Timeline**:
 *   Square-cropped image on the left, text on the right — side-by-side, so a
 *   row stays short.
 *
 * **Detail**:
 *   Image on top at its natural aspect ratio, text below — full-width display.
 *
 * Design follows the project's flat design philosophy — no shadows, uses
 * border + rounded-xl consistent with the media cards in PostCard.
 */
export function OgpCard({ url, variant }: OgpCardProps) {
  const spotify = parseSpotifyUrl(url);
  const youtube = parseYoutubeUrl(url);
  const twitter = parseTwitterUrl(url);
  const isTwitterEmbed = variant === "detail" && twitter;
  const isEmbed = spotify || youtube || isTwitterEmbed;
  const { data: ogp, isLoading, isError } = useOgp(isEmbed ? null : url);

  if (spotify) return <SpotifyEmbed url={url} />;
  if (youtube) return <YouTubeEmbed url={url} />;
  if (isTwitterEmbed) return <TwitterEmbed url={url} />;

  // --- Loading spinner ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  // --- Error or no data: render nothing ---
  if (isError || !ogp) return null;

  const displayUrl = (() => {
    try {
      return new URL(ogp.url ?? url).hostname;
    } catch {
      return ogp.siteName ?? url;
    }
  })();

  // Proxied through the backend rather than loaded directly, so the linked
  // site never sees the viewer's IP or referrer.
  const imageProxyUrl = ogp.image
    ? `${resolveApiBaseUrl()}/ogp/image?${new URLSearchParams({ url: ogp.image }).toString()}`
    : null;

  if (variant === "timeline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex rounded-xl border border-border overflow-hidden hover:bg-muted/50 transition-colors"
      >
        {/* Square-cropped thumbnail */}
        {imageProxyUrl && (
          <div className="relative shrink-0 w-[108px] h-[108px] bg-muted">
            <img
              src={imageProxyUrl}
              alt={ogp.title ?? ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Text content */}
        <div className="flex flex-col justify-center p-3 min-w-0">
          {ogp.title && (
            <p className="text-sm font-medium text-foreground line-clamp-2 break-words">
              {ogp.title}
            </p>
          )}

          {ogp.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 break-words">
              {ogp.description}
            </p>
          )}

          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink size={12} className="shrink-0 opacity-60" />
            <span className="truncate">{ogp.siteName ?? displayUrl}</span>
          </div>
        </div>
      </a>
    );
  }

  // --- Detail layout: image on top at its natural aspect ratio ---
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-border overflow-hidden hover:bg-muted/50 transition-colors"
    >
      {/* OGP Image */}
      {imageProxyUrl && (
        <div className="relative w-full bg-muted">
          <img src={imageProxyUrl} alt={ogp.title ?? ""} className="w-full h-auto" loading="lazy" />
        </div>
      )}

      {/* Text content */}
      <div className="p-3 min-w-0">
        {ogp.title && (
          <p className="text-sm font-medium text-foreground line-clamp-2 break-words">
            {ogp.title}
          </p>
        )}

        {ogp.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-words">
            {ogp.description}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink size={12} className="shrink-0 opacity-60" />
          <span className="truncate">{ogp.siteName ?? displayUrl}</span>
        </div>
      </div>
    </a>
  );
}
