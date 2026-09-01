"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Crop, X } from "lucide-react";
import { BlurhashImage } from "@/components/BlurhashImage";
import { getBlurhashDataUrl } from "@/lib/blurhash";
import { pixelArtRendering } from "@/lib/media/display";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { MediaQualityControl } from "@/components/post-composer/MediaQualityPicker";
import { MediaConversionIndicator } from "@/components/post-composer/MediaConversionIndicator";
import type { PreviewMediaItem } from "@/components/post-composer/types";
import type { QualityMode } from "@/components/post-composer/MediaQualityPicker";

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
  /** Called when the compression mode of an attachment is changed. */
  onQualityChange?: (id: string, mode: QualityMode) => void;
  /**
   * Called when a media item (image) should open the lightbox at the given
   * index. `source` is the item's wrapper element — the lightbox morphs out of
   * it, and reads its rounding from it.
   */
  onLightboxOpen?: (index: number, source: HTMLElement | null) => void;
  /**
   * Index of the image the lightbox is currently showing. That cell falls back
   * to its blurhash so the same image is never painted twice on screen at once.
   */
  hiddenIndex?: number | null;
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
      className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
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
      className="absolute top-2 right-[46px] z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
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
 * In `editable` mode the edit controls are overlaid on each media item.
 */
export function PostMediaPreview({
  media,
  editable = false,
  onRemove,
  onCrop,
  onQualityChange,
  onLightboxOpen,
  hiddenIndex,
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

  // Marks the wrapper the lightbox morph animates from, and — while the
  // lightbox has that image — swaps the cell for its blurhash. Only meaningful
  // when a lightbox is wired up, so the composer preview stays untouched.
  const lightboxIndexAttr = (index: number) =>
    onLightboxOpen ? { "data-lightbox-index": index } : undefined;

  /** True while the lightbox is the one painting this image. */
  const isHidden = (index: number) =>
    Boolean(onLightboxOpen) && hiddenIndex === index;

  /** Blurhash stand-in for the cell the lightbox has taken over. */
  const hiddenStyle = (
    index: number,
    item: PreviewMediaItem,
  ): React.CSSProperties | undefined =>
    isHidden(index)
      ? {
          backgroundImage: `url(${getBlurhashDataUrl(item.blurhash)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : undefined;

  /**
   * The card must not also paint what the lightbox is showing.
   *
   * `invisible` rather than `opacity-0`: BlurhashImage appends its own
   * `transition-opacity` after this class, so an opacity hide would fade over
   * 240ms — leaving the duplicate on screen for exactly the stretch of the
   * morph where the backdrop is still too light to cover it.
   */
  const hiddenClass = (index: number) =>
    isHidden(index) ? "invisible" : undefined;

  /**
   * Controls overlaid on an image in editable mode. Animated images skip the
   * quality and crop controls: they are passed through to the server untouched.
   */
  const renderEditOverlay = (item: PreviewMediaItem) => {
    if (!editable) return null;
    return (
      <>
        {onQualityChange && !item.isAnimated && (
          <MediaQualityControl
            kind="image"
            value={item.quality ?? "balance"}
            allowNone={item.allowNoConversion}
            onChange={(mode) => onQualityChange(item.id, mode)}
          />
        )}
        {onCrop && !item.isAnimated && (
          <CropButton onClick={() => onCrop(item.id)} label={cropLabel} />
        )}
        {onRemove && (
          <RemoveButton onClick={() => onRemove(item.id)} label={removeLabel} />
        )}
      </>
    );
  };

  const renderImageActionOverlay = (item: PreviewMediaItem, index: number) => {
    // The button is `absolute inset-0` directly inside the wrapper, so its
    // parent is the element that carries the rect, the rounding and the index.
    const action: ((e: React.MouseEvent<HTMLButtonElement>) => void) | null =
      onLightboxOpen
        ? (e) => onLightboxOpen(index, e.currentTarget.parentElement)
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
          {videoMedia.conversionProgress != null ? (
            <MediaConversionIndicator progress={videoMedia.conversionProgress} />
          ) : (
            editable &&
            onQualityChange && (
              <MediaQualityControl
                kind="video"
                value={videoMedia.quality ?? "balance"}
                allowNone={videoMedia.allowNoConversion}
                onChange={(mode) => onQualityChange(videoMedia.id, mode)}
              />
            )
          )}
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
          style={{ ...singleImageStyle, ...hiddenStyle(0, imageMedia[0]) }}
          {...lightboxIndexAttr(0)}
        >
          <BlurhashImage
            blurhash={imageMedia[0].blurhash}
            src={imageMedia[0].url}
            style={{ imageRendering: pixelArtRendering(imageMedia[0].width) }}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover",
              hiddenClass(0),
              getImageCursorClass(imageMedia[0]),
            )}
            sizes="(max-width: 600px) 100vw, 600px"
          />
          {renderImageActionOverlay(imageMedia[0], 0)}
          {renderEditOverlay(imageMedia[0])}
        </div>
      </div>
    );
  }

  // 2 images: side by side, 8:9
  if (imageMedia.length === 2) {
    return (
      <div className={cn("grid grid-cols-2 gap-1", className)}>
        <div
          className="relative aspect-[8/9] overflow-hidden rounded-l-xl group"
          {...lightboxIndexAttr(0)}
          style={hiddenStyle(0, imageMedia[0])}
        >
          <BlurhashImage
            blurhash={imageMedia[0].blurhash}
            src={imageMedia[0].url}
            style={{ imageRendering: pixelArtRendering(imageMedia[0].width) }}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover",
              hiddenClass(0),
              getImageCursorClass(imageMedia[0]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[0], 0)}
          {renderEditOverlay(imageMedia[0])}
        </div>
        <div
          className="relative aspect-[8/9] overflow-hidden rounded-r-xl group"
          {...lightboxIndexAttr(1)}
          style={hiddenStyle(1, imageMedia[1])}
        >
          <BlurhashImage
            blurhash={imageMedia[1].blurhash}
            src={imageMedia[1].url}
            style={{ imageRendering: pixelArtRendering(imageMedia[1].width) }}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover",
              hiddenClass(1),
              getImageCursorClass(imageMedia[1]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[1], 1)}
          {renderEditOverlay(imageMedia[1])}
        </div>
      </div>
    );
  }

  // 3 images: left auto-height, right top/bottom 16:9
  if (imageMedia.length === 3) {
    return (
      <div className={cn("grid grid-cols-2 gap-1", className)}>
        <div
          className="relative row-span-2 overflow-hidden rounded-l-xl group"
          {...lightboxIndexAttr(0)}
          style={hiddenStyle(0, imageMedia[0])}
        >
          <BlurhashImage
            blurhash={imageMedia[0].blurhash}
            src={imageMedia[0].url}
            style={{ imageRendering: pixelArtRendering(imageMedia[0].width) }}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover",
              hiddenClass(0),
              getImageCursorClass(imageMedia[0]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[0], 0)}
          {renderEditOverlay(imageMedia[0])}
        </div>
        <div
          className="relative aspect-video overflow-hidden rounded-tr-xl group"
          {...lightboxIndexAttr(1)}
          style={hiddenStyle(1, imageMedia[1])}
        >
          <BlurhashImage
            blurhash={imageMedia[1].blurhash}
            src={imageMedia[1].url}
            style={{ imageRendering: pixelArtRendering(imageMedia[1].width) }}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover",
              hiddenClass(1),
              getImageCursorClass(imageMedia[1]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[1], 1)}
          {renderEditOverlay(imageMedia[1])}
        </div>
        <div
          className="relative aspect-video overflow-hidden rounded-br-xl group"
          {...lightboxIndexAttr(2)}
          style={hiddenStyle(2, imageMedia[2])}
        >
          <BlurhashImage
            blurhash={imageMedia[2].blurhash}
            src={imageMedia[2].url}
            style={{ imageRendering: pixelArtRendering(imageMedia[2].width) }}
            alt=""
            fill
            unoptimized
            className={cn(
              "object-cover",
              hiddenClass(2),
              getImageCursorClass(imageMedia[2]),
            )}
            sizes="(max-width: 600px) 50vw, 300px"
          />
          {renderImageActionOverlay(imageMedia[2], 2)}
          {renderEditOverlay(imageMedia[2])}
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
            className={cn(
              "relative aspect-video overflow-hidden group",
              roundingClasses[i],
            )}
            {...lightboxIndexAttr(i)}
            style={hiddenStyle(i, item)}
          >
            <BlurhashImage
              blurhash={item.blurhash}
              src={item.url}
              style={{ imageRendering: pixelArtRendering(item.width) }}
              alt=""
              fill
              unoptimized
              className={cn(
                "object-cover",
                hiddenClass(i),
                getImageCursorClass(item),
              )}
              sizes="(max-width: 600px) 50vw, 300px"
            />
            {renderImageActionOverlay(item, i)}
            {renderEditOverlay(item)}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
