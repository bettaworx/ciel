"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Crop, X } from "lucide-react";
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
  /** Called when a crop button is clicked. Receives the media item id. */
  onCrop?: (id: string) => void;
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
      className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      aria-label={label}
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
}

function CropButton({
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
      className="absolute top-2 right-[46px] z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      aria-label={label}
    >
      <Crop className="w-3.5 h-3.5" />
    </button>
  );
}

function computeMediaStyle(
  width: number | null | undefined,
  height: number | null | undefined,
  isDesktop: boolean,
): React.CSSProperties | undefined {
  if (!width || !height || width <= 0 || height <= 0) return undefined;
  const MIN_RATIO = 3 / 4;
  const MAX_RATIO = 21 / 9;
  const MAX_HEIGHT = 512;
  const ratio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, width / height));
  return {
    aspectRatio: `${ratio}`,
    ...(isDesktop && { maxWidth: `${MAX_HEIGHT * ratio}px` }),
  };
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
  onCrop,
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

  // Single image/video display constraints:
  //   Aspect ratio clamped between 3:4 (portrait) and 21:9 (landscape)
  //   Max height: 512px on desktop (enforced via maxWidth + aspectRatio)
  const singleImageStyle = useMemo(
    () =>
      media.length === 1 && media[0].type === "image"
        ? computeMediaStyle(media[0].width, media[0].height, isDesktop)
        : undefined,
    [media, isDesktop],
  );

  const singleVideoStyle = useMemo(
    () => computeMediaStyle(videoMedia?.width, videoMedia?.height, isDesktop),
    [videoMedia, isDesktop],
  );

  if (media.length === 0) return null;

  const removeLabel = tCompose("removeImage");
  const cropLabel = tCompose("cropImage");

  const getImageCursorClass = (item: PreviewMediaItem) => {
    if (onLightboxOpen) return "cursor-zoom-in";
    if (editable && onCrop && !item.isAnimated) return "cursor-pointer";
    return undefined;
  };

  const renderImageActionOverlay = (item: PreviewMediaItem, index: number) => {
    const action = onLightboxOpen
      ? () => onLightboxOpen(index)
      : editable && onCrop && !item.isAnimated
        ? () => onCrop(item.id)
        : null;

    if (!action) return null;

    return (
      <button
        type="button"
        onClick={action}
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={onLightboxOpen ? tLightbox("open") : cropLabel}
      />
    );
  };

  // --- Video ---
  if (videoMedia) {
    return (
      <div className={className}>
        <div
          className="relative w-full bg-muted overflow-hidden rounded-xl group"
          style={singleVideoStyle}
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

  // 1 image
  if (imageMedia.length === 1) {
    return (
      <div className={className}>
        <div
          className="relative w-full overflow-hidden rounded-xl group"
          style={singleImageStyle}
        >
          <Image
            src={imageMedia[0].url}
            alt=""
            fill
            unoptimized
            className={cn("object-cover", getImageCursorClass(imageMedia[0]))}
            sizes="(max-width: 600px) 100vw, 600px"
          />
          {renderImageActionOverlay(imageMedia[0], 0)}
          {editable && onCrop && !imageMedia[0].isAnimated && (
            <CropButton onClick={() => onCrop(imageMedia[0].id)} label={cropLabel} />
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
      <div className={cn("grid grid-cols-2 gap-1", className)}>
        <div className="relative aspect-[8/9] overflow-hidden group">
          <Image
            src={imageMedia[0].url}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover rounded-l-xl",
              getImageCursorClass(imageMedia[0]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[0], 0)}
          {editable && onCrop && !imageMedia[0].isAnimated && (
            <CropButton onClick={() => onCrop(imageMedia[0].id)} label={cropLabel} />
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
              getImageCursorClass(imageMedia[1]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[1], 1)}
          {editable && onCrop && !imageMedia[1].isAnimated && (
            <CropButton onClick={() => onCrop(imageMedia[1].id)} label={cropLabel} />
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
      <div className={cn("grid grid-cols-2 gap-1", className)}>
        <div className="relative row-span-2 overflow-hidden group">
          <Image
            src={imageMedia[0].url}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover rounded-l-xl",
              getImageCursorClass(imageMedia[0]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[0], 0)}
          {editable && onCrop && !imageMedia[0].isAnimated && (
            <CropButton onClick={() => onCrop(imageMedia[0].id)} label={cropLabel} />
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
              getImageCursorClass(imageMedia[1]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[1], 1)}
          {editable && onCrop && !imageMedia[1].isAnimated && (
            <CropButton onClick={() => onCrop(imageMedia[1].id)} label={cropLabel} />
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
              getImageCursorClass(imageMedia[2]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[2], 2)}
          {editable && onCrop && !imageMedia[2].isAnimated && (
            <CropButton onClick={() => onCrop(imageMedia[2].id)} label={cropLabel} />
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
      <div className={cn("grid grid-cols-2 gap-1", className)}>
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
                getImageCursorClass(item),
              )}
              sizes="(max-width: 600px) 50vw, 300px"
            />
            {renderImageActionOverlay(item, i)}
            {editable && onCrop && !item.isAnimated && (
              <CropButton onClick={() => onCrop(item.id)} label={cropLabel} />
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
