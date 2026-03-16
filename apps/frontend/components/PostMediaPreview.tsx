"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import type { PreviewMediaItem } from "@/components/post-composer/types";

const VideoPlayer = dynamic(
  () => import("@/components/VideoPlayer").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted animate-pulse rounded-xl" />
    ),
  },
);

export interface PostMediaPreviewProps {
  /** List of media items to render. */
  media: PreviewMediaItem[];
  /**
   * When true, a remove button (×) is overlaid on each media item.
   * Used in the post composer.
   */
  editable?: boolean;
  /** Called when a remove button is clicked. Receives the media item id. */
  onRemove?: (id: string) => void;
  /** Called when a media item (image) should open the lightbox at the given index. */
  onLightboxOpen?: (index: number) => void;
  /** Additional class name for the outer wrapper. */
  className?: string;
}

/**
 * Remove button overlaid on a media item (editable mode).
 */
function RemoveButton({
  onClick,
  label,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity"
      aria-label={label}
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
}

/**
 * Shared media preview component used by both PostCard and the post composer.
 *
 * Renders:
 * - **Video**: Custom VideoPlayer (single video only)
 * - **Image grid**: 1-4 images with responsive layouts identical to PostCard
 *   - 1 image: dynamic aspect ratio (clamped 3:4 to 21:9), max 512px height on desktop
 *   - 2 images: side-by-side 8:9
 *   - 3 images: left column spans 2 rows, right column has two 16:9 thumbnails
 *   - 4 images: 2×2 grid, all 16:9
 *
 * In `editable` mode a × button is shown on hover for each media item.
 */
export function PostMediaPreview({
  media,
  editable = false,
  onRemove,
  onLightboxOpen,
  className,
}: PostMediaPreviewProps) {
  const tLightbox = useTranslations("lightbox");
  const tCompose = useTranslations("createPost");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const videoMedia = useMemo(
    () => media.find((m) => m.type === "video"),
    [media],
  );
  const imageMedia = useMemo(
    () => media.filter((m) => m.type !== "video"),
    [media],
  );

  // Single image display constraints (same as PostCard):
  //   Aspect ratio: 3:4 (portrait) to 21:9 (landscape), clipped via object-cover
  //   Max height: 512px on desktop (enforced via maxWidth + aspectRatio)
  const singleImageStyle = useMemo((): React.CSSProperties | undefined => {
    if (media.length !== 1 || media[0].type !== "image") return undefined;
    const m = media[0];
    if (!m.width || !m.height || m.width <= 0 || m.height <= 0)
      return undefined;

    const MIN_RATIO = 3 / 4; // portrait limit
    const MAX_RATIO = 21 / 9; // landscape limit
    const MAX_HEIGHT = 512;

    const ratio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, m.width / m.height));

    return {
      aspectRatio: `${ratio}`,
      ...(isDesktop && { maxWidth: `${MAX_HEIGHT * ratio}px` }),
    };
  }, [media, isDesktop]);

  if (media.length === 0) return null;

  const removeLabel = tCompose("removeImage");

  // --- Video ---
  if (videoMedia) {
    return (
      <div className={cn("mb-3", className)}>
        <div
          className="relative w-full bg-muted overflow-hidden rounded-xl group"
          style={singleImageStyle}
        >
          <VideoPlayer
            src={videoMedia.url}
            width={videoMedia.width}
            height={videoMedia.height}
            poster={videoMedia.thumbnailUrl}
            className="w-full h-full"
          />
          {editable && onRemove && (
            <RemoveButton
              onClick={() => onRemove(videoMedia.id)}
              label={tCompose("removeVideo")}
            />
          )}
        </div>
      </div>
    );
  }

  // --- Images ---
  if (imageMedia.length === 0) return null;

  // Helper to render a single image cell
  const renderImageCell = (
    item: PreviewMediaItem,
    index: number,
    extraImgClass?: string,
  ) => (
    <div key={item.id} className="relative overflow-hidden group">
      <Image
        src={item.url}
        alt=""
        fill
        unoptimized
        className={cn(
          "object-cover",
          onLightboxOpen && "cursor-zoom-in",
          extraImgClass,
        )}
        sizes="(max-width: 600px) 100vw, 600px"
      />
      {onLightboxOpen && (
        <button
          type="button"
          onClick={() => onLightboxOpen(index)}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={tLightbox("open")}
        />
      )}
      {editable && onRemove && (
        <RemoveButton onClick={() => onRemove(item.id)} label={removeLabel} />
      )}
    </div>
  );

  // 1 image
  if (imageMedia.length === 1) {
    return (
      <div className={cn("mb-3", className)}>
        <div
          className="relative w-full overflow-hidden rounded-xl group"
          style={singleImageStyle}
        >
          <Image
            src={imageMedia[0].url}
            alt=""
            fill
            unoptimized
            className={cn("object-cover", onLightboxOpen && "cursor-zoom-in")}
            sizes="(max-width: 600px) 100vw, 600px"
          />
          {onLightboxOpen && (
            <button
              type="button"
              onClick={() => onLightboxOpen(0)}
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={tLightbox("open")}
            />
          )}
          {editable && onRemove && (
            <RemoveButton
              onClick={() => onRemove(imageMedia[0].id)}
              label={removeLabel}
            />
          )}
        </div>
      </div>
    );
  }

  // 2 images: side by side, 8:9
  if (imageMedia.length === 2) {
    return (
      <div className={cn("grid grid-cols-2 gap-1 mb-3", className)}>
        <div className="relative aspect-[8/9] overflow-hidden group">
          <Image
            src={imageMedia[0].url}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover rounded-l-xl",
              onLightboxOpen && "cursor-zoom-in",
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {onLightboxOpen && (
            <button
              type="button"
              onClick={() => onLightboxOpen(0)}
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={tLightbox("open")}
            />
          )}
          {editable && onRemove && (
            <RemoveButton
              onClick={() => onRemove(imageMedia[0].id)}
              label={removeLabel}
            />
          )}
        </div>
        <div className="relative aspect-[8/9] overflow-hidden group">
          <Image
            src={imageMedia[1].url}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover rounded-r-xl",
              onLightboxOpen && "cursor-zoom-in",
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {onLightboxOpen && (
            <button
              type="button"
              onClick={() => onLightboxOpen(1)}
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={tLightbox("open")}
            />
          )}
          {editable && onRemove && (
            <RemoveButton
              onClick={() => onRemove(imageMedia[1].id)}
              label={removeLabel}
            />
          )}
        </div>
      </div>
    );
  }

  // 3 images: left auto-height, right top/bottom 16:9
  if (imageMedia.length === 3) {
    return (
      <div className={cn("grid grid-cols-2 gap-1 mb-3", className)}>
        <div className="relative row-span-2 overflow-hidden group">
          <Image
            src={imageMedia[0].url}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover rounded-l-xl",
              onLightboxOpen && "cursor-zoom-in",
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {onLightboxOpen && (
            <button
              type="button"
              onClick={() => onLightboxOpen(0)}
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={tLightbox("open")}
            />
          )}
          {editable && onRemove && (
            <RemoveButton
              onClick={() => onRemove(imageMedia[0].id)}
              label={removeLabel}
            />
          )}
        </div>
        <div className="relative aspect-video overflow-hidden group">
          <Image
            src={imageMedia[1].url}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover rounded-tr-xl",
              onLightboxOpen && "cursor-zoom-in",
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {onLightboxOpen && (
            <button
              type="button"
              onClick={() => onLightboxOpen(1)}
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={tLightbox("open")}
            />
          )}
          {editable && onRemove && (
            <RemoveButton
              onClick={() => onRemove(imageMedia[1].id)}
              label={removeLabel}
            />
          )}
        </div>
        <div className="relative aspect-video overflow-hidden group">
          <Image
            src={imageMedia[2].url}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover rounded-br-xl",
              onLightboxOpen && "cursor-zoom-in",
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {onLightboxOpen && (
            <button
              type="button"
              onClick={() => onLightboxOpen(2)}
              className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={tLightbox("open")}
            />
          )}
          {editable && onRemove && (
            <RemoveButton
              onClick={() => onRemove(imageMedia[2].id)}
              label={removeLabel}
            />
          )}
        </div>
      </div>
    );
  }

  // 4 images: 2×2 grid, all 16:9
  if (imageMedia.length >= 4) {
    const fourImages = imageMedia.slice(0, 4);
    const roundingClasses = [
      "rounded-tl-xl",
      "rounded-tr-xl",
      "rounded-bl-xl",
      "rounded-br-xl",
    ];
    return (
      <div className={cn("grid grid-cols-2 gap-1 mb-3", className)}>
        {fourImages.map((item, i) => (
          <div
            key={item.id}
            className="relative aspect-video overflow-hidden group"
          >
            <Image
              src={item.url}
              alt=""
              fill
              unoptimized
              className={cn(
                "object-cover",
                roundingClasses[i],
                onLightboxOpen && "cursor-zoom-in",
              )}
              sizes="(max-width: 600px) 50vw, 300px"
            />
            {onLightboxOpen && (
              <button
                type="button"
                onClick={() => onLightboxOpen(i)}
                className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={tLightbox("open")}
              />
            )}
            {editable && onRemove && (
              <RemoveButton
                onClick={() => onRemove(item.id)}
                label={removeLabel}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
