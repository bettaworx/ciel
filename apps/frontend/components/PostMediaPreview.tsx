"use client";

import { useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { Crop, X } from "lucide-react";
import { BlurhashImage } from "@/components/BlurhashImage";
import { getBlurhashDataUrl } from "@/lib/blurhash";
import { pixelArtRendering } from "@/lib/media/display";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { carouselItemRatio, GRID_CELLS, MAX_GRID_ITEMS } from "@/lib/media/layout";
import { MediaCarousel } from "@/components/MediaCarousel";
import { PlayMarkIcon, playMarkClass } from "@/components/PlayMark";
import { MediaQualityControl } from "@/components/post-composer/MediaQualityPicker";
import { MediaConversionIndicator } from "@/components/post-composer/MediaConversionIndicator";
import type { PreviewMediaItem } from "@/components/post-composer/types";
import type { QualityMode } from "@/components/post-composer/MediaQualityPicker";

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
  /**
   * The item the lightbox has open, which a carousel keeps centred: set from
   * the click that opens it, then following every move inside it.
   */
  focusIndex?: number | null;
  /** Additional class name for the outer wrapper. */
  className?: string;
  /** CSS length the whole preview must fit within; narrows it instead of letting it overflow. */
  maxHeight?: string;
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
      className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-colors"
      aria-label={label}
    >
      <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
    </button>
  );
}

function CropButton({ onClick, label }: { onClick: (e: React.MouseEvent) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="absolute top-2 right-[38px] sm:right-[46px] z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2 transition-colors"
      aria-label={label}
    >
      <Crop className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
    </button>
  );
}

function computeMediaStyle(
  width: number | null | undefined,
  height: number | null | undefined,
  isDesktop: boolean,
  maxHeight?: string,
): React.CSSProperties | undefined {
  if (!width || !height || width <= 0 || height <= 0) return undefined;
  const MIN_RATIO = 3 / 4;
  const MAX_RATIO = 21 / 9;
  const MAX_HEIGHT = 512;
  const ratio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, width / height));
  return {
    aspectRatio: `${ratio}`,
    ...(isDesktop && { maxWidth: `${MAX_HEIGHT * ratio}px` }),
    ...(maxHeight && {
      maxWidth: isDesktop
        ? `min(${MAX_HEIGHT * ratio}px, calc(${maxHeight} * ${ratio}))`
        : `calc(${maxHeight} * ${ratio})`,
    }),
  };
}

/**
 * Shared media preview component used by both PostCard and the post composer.
 *
 * Images and videos share one ordered list (up to 20 per post), in any mix:
 * - 1 item: its own aspect ratio (clamped 3:4 to 21:9), max 512px tall on desktop
 * - 2-4 items: the side-by-side, 1+2 and 2×2 layouts
 * - 5+ items: a swipeable carousel (MediaCarousel); landscape slides are capped
 *   at 4:3, portrait images keep their shape (videos stop at 3:4)
 * See lib/media/layout.ts.
 *
 * Outside the composer a video shows its poster with a play mark, and opens in
 * the lightbox like an image does, so cell and lightbox indices are the same.
 * In `editable` mode (the composer, which has no lightbox) a video plays in
 * place, and the edit controls are overlaid on each item.
 */
export function PostMediaPreview({
  media,
  editable = false,
  onRemove,
  onCrop,
  onQualityChange,
  onLightboxOpen,
  hiddenIndex,
  focusIndex,
  className,
  maxHeight,
}: PostMediaPreviewProps) {
  const tLightbox = useTranslations("lightbox");
  const tCompose = useTranslations("createPost");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const singleStyle = useMemo(
    () =>
      media.length === 1
        ? computeMediaStyle(media[0].width, media[0].height, isDesktop, maxHeight)
        : undefined,
    [media, isDesktop, maxHeight],
  );

  if (media.length === 0) return null;

  const removeLabel = tCompose("removeMedia");
  const cropLabel = tCompose("cropImage");

  const getImageCursorClass = (item: PreviewMediaItem) => {
    if (onLightboxOpen) return item.type === "video" ? "cursor-pointer" : "cursor-zoom-in";
    if (editable && onCrop && !item.isAnimated) return "cursor-pointer";
    return undefined;
  };

  // Marks the wrapper the lightbox morph animates from, and — while the
  // lightbox has that image — swaps the cell for its blurhash. Only meaningful
  // when a lightbox is wired up, so the composer preview stays untouched.
  const lightboxIndexAttr = (index: number) =>
    onLightboxOpen ? { "data-lightbox-index": index } : undefined;

  /** True while the lightbox is the one painting this image. */
  const isHidden = (index: number) => Boolean(onLightboxOpen) && hiddenIndex === index;

  /** Blurhash stand-in for the cell the lightbox has taken over. */
  const hiddenStyle = (index: number, item: PreviewMediaItem): React.CSSProperties | undefined =>
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
  const hiddenClass = (index: number) => (isHidden(index) ? "invisible" : undefined);

  /**
   * Controls overlaid on an item in editable mode. Animated images skip the
   * quality and crop controls: they are passed through to the server untouched.
   * Videos cannot be cropped, and show their conversion progress in place of
   * the quality control while converting.
   */
  const renderEditOverlay = (item: PreviewMediaItem) => {
    if (!editable) return null;
    const isVideo = item.type === "video";
    return (
      <>
        {isVideo && item.conversionProgress != null ? (
          <MediaConversionIndicator progress={item.conversionProgress} />
        ) : (
          onQualityChange &&
          !item.isAnimated && (
            <MediaQualityControl
              kind={item.type}
              value={item.quality ?? "balance"}
              allowNone={item.allowNoConversion}
              onChange={(mode) => onQualityChange(item.id, mode)}
            />
          )
        )}
        {onCrop && !isVideo && !item.isAnimated && (
          <CropButton onClick={() => onCrop(item.id)} label={cropLabel} />
        )}
        {onRemove && <RemoveButton onClick={() => onRemove(item.id)} label={removeLabel} />}
      </>
    );
  };

  const renderImageActionOverlay = (item: PreviewMediaItem, index: number) => {
    // The button is `absolute inset-0` directly inside the wrapper, so its
    // parent is the element that carries the rect, the rounding and the index.
    const action: ((e: React.MouseEvent<HTMLButtonElement>) => void) | null = onLightboxOpen
      ? (e) => onLightboxOpen(index, e.currentTarget.parentElement)
      : editable && onCrop && item.type === "image" && !item.isAnimated
        ? () => onCrop(item.id)
        : null;

    if (!action) return null;

    return (
      <button
        type="button"
        onClick={action}
        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={
          onLightboxOpen ? tLightbox(item.type === "video" ? "openVideo" : "open") : cropLabel
        }
      />
    );
  };

  /** One attachment, image or video, in a wrapper sized by `cellClass`. */
  const renderCell = (
    item: PreviewMediaItem,
    i: number,
    cellClass: string,
    sizes: string,
    style?: React.CSSProperties,
  ) => {
    const isVideo = item.type === "video";
    // Every cell is a still: the image itself, or a video's poster with a play
    // mark. Videos only play in the lightbox. Clicking opens it, or crops an
    // image in the composer, which has no lightbox.
    const still = isVideo ? item.thumbnailUrl : item.url;
    return (
      <div
        key={item.id}
        className={cn("relative overflow-hidden group/media", isVideo && "bg-muted", cellClass)}
        {...lightboxIndexAttr(i)}
        style={{ ...style, ...hiddenStyle(i, item) }}
      >
        {still && (
          <BlurhashImage
            blurhash={item.blurhash}
            src={still}
            style={{ imageRendering: pixelArtRendering(item.width) }}
            alt=""
            fill
            unoptimized
            className={cn("object-cover", hiddenClass(i), getImageCursorClass(item))}
            sizes={sizes}
          />
        )}
        {/* A video picked in the composer has no server thumbnail yet: its own
            first frame stands in, without any player controls. */}
        {isVideo && !still && (
          <video
            src={item.url}
            muted
            playsInline
            preload="auto"
            aria-hidden
            className={cn("absolute inset-0 h-full w-full object-cover", hiddenClass(i))}
          />
        )}
        {/* The player's own play button, reacting to hover on the cell. */}
        {isVideo && (
          <span
            aria-hidden
            className={cn(playMarkClass("cell"), "pointer-events-none", hiddenClass(i))}
          >
            <PlayMarkIcon />
          </span>
        )}
        {renderImageActionOverlay(item, i)}
        {renderEditOverlay(item)}
      </div>
    );
  };

  if (media.length === 1) {
    return (
      <div className={className}>
        {renderCell(
          media[0],
          0,
          "w-full rounded-xl",
          "(max-width: 600px) 100vw, 600px",
          singleStyle,
        )}
      </div>
    );
  }

  if (media.length > MAX_GRID_ITEMS) {
    return (
      <MediaCarousel className={className} maxHeight={maxHeight} focusIndex={focusIndex}>
        {media.map((item, i) =>
          renderCell(
            item,
            i,
            // min-w: two corner radii, the floor for an uncapped portrait image.
            // max-w: never wider than the track, or an end slide could not rest
            // flush with its edge (see carouselSnapPoints).
            "h-full min-w-[calc(var(--radius-xl)*2)] max-w-full flex-none snap-center rounded-xl",
            "(max-width: 600px) 75vw, 384px",
            {
              aspectRatio: `${carouselItemRatio(item.width, item.height, item.type)}`,
            },
          ),
        )}
      </MediaCarousel>
    );
  }

  const cells = GRID_CELLS[media.length as 2 | 3 | 4];
  // The 2-4 grids are all ~16:9 overall, so capping the width caps the height.
  const gridStyle: React.CSSProperties | undefined = maxHeight
    ? { maxWidth: `calc(${maxHeight} * 16 / 9)` }
    : undefined;

  return (
    <div className={cn("grid grid-cols-2 gap-1", className)} style={gridStyle}>
      {media.map((item, i) => renderCell(item, i, cells[i], "(max-width: 600px) 50vw, 300px"))}
    </div>
  );
}
