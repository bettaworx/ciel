"use client";

import { lazy, Suspense, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { Crop, X } from "lucide-react";
import { BlurhashImage } from "@/components/BlurhashImage";
import { getBlurhashDataUrl } from "@/lib/blurhash";
import { pixelArtRendering } from "@/lib/media/display";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { lightboxIndices, mediaGridLayout } from "@/lib/media/layout";
import { MediaQualityControl } from "@/components/post-composer/MediaQualityPicker";
import { MediaConversionIndicator } from "@/components/post-composer/MediaConversionIndicator";
import type { PreviewMediaItem } from "@/components/post-composer/types";
import type { QualityMode } from "@/components/post-composer/MediaQualityPicker";

// Split out because it pulls in the media stack, which most timelines never
// need.
const VideoPlayer = lazy(() =>
  import("@/components/VideoPlayer").then((mod) => ({ default: mod.VideoPlayer })),
);

function VideoPlayerFallback() {
  return <div className="w-full h-full bg-muted animate-pulse rounded-xl" />;
}

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
 * - 5+ items: a 3-column grid of squares, every item visible
 * See mediaGridLayout in lib/media/layout.ts.
 *
 * Videos play in their own cell; the lightbox only takes images, so lightbox
 * indices count images alone. In `editable` mode the edit controls are
 * overlaid on each item.
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
  maxHeight,
}: PostMediaPreviewProps) {
  const tLightbox = useTranslations("lightbox");
  const tCompose = useTranslations("createPost");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const lightboxIndex = useMemo(() => lightboxIndices(media.map((m) => m.type)), [media]);

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
        {onRemove && <RemoveButton onClick={() => onRemove(item.id)} label={removeLabel} />}
      </>
    );
  };

  const renderImageActionOverlay = (item: PreviewMediaItem, index: number) => {
    // The button is `absolute inset-0` directly inside the wrapper, so its
    // parent is the element that carries the rect, the rounding and the index.
    const action: ((e: React.MouseEvent<HTMLButtonElement>) => void) | null = onLightboxOpen
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

  /** One attachment, image or video, in a wrapper sized by `cellClass`. */
  const renderCell = (
    item: PreviewMediaItem,
    i: number,
    cellClass: string,
    sizes: string,
    style?: React.CSSProperties,
  ) => {
    const li = lightboxIndex[i];
    // null exactly for videos, which play in place instead of in the lightbox.
    if (li === null) {
      return (
        <div
          key={item.id}
          className={cn("relative bg-muted overflow-hidden group", cellClass)}
          style={style}
        >
          <Suspense fallback={<VideoPlayerFallback />}>
            <VideoPlayer
              src={item.url}
              width={item.width}
              height={item.height}
              poster={item.thumbnailUrl}
              className="w-full h-full"
            />
          </Suspense>
          {item.conversionProgress != null ? (
            <MediaConversionIndicator progress={item.conversionProgress} />
          ) : (
            editable &&
            onQualityChange && (
              <MediaQualityControl
                kind="video"
                value={item.quality ?? "balance"}
                allowNone={item.allowNoConversion}
                onChange={(mode) => onQualityChange(item.id, mode)}
              />
            )
          )}
          {editable && onRemove && (
            <RemoveButton onClick={() => onRemove(item.id)} label={removeLabel} />
          )}
        </div>
      );
    }
    return (
      <div
        key={item.id}
        className={cn("relative overflow-hidden group", cellClass)}
        {...lightboxIndexAttr(li)}
        style={{ ...style, ...hiddenStyle(li, item) }}
      >
        <BlurhashImage
          blurhash={item.blurhash}
          src={item.url}
          style={{ imageRendering: pixelArtRendering(item.width) }}
          alt=""
          fill
          unoptimized
          className={cn("object-cover", hiddenClass(li), getImageCursorClass(item))}
          sizes={sizes}
        />
        {renderImageActionOverlay(item, li)}
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

  const layout = mediaGridLayout(media.length);
  // Capping the width at the grid's overall ratio is what caps its height.
  const gridStyle: React.CSSProperties | undefined = maxHeight
    ? { maxWidth: `calc(${maxHeight} * ${layout.ratio})` }
    : undefined;
  const sizes =
    layout.columns === 3 ? "(max-width: 600px) 33vw, 200px" : "(max-width: 600px) 50vw, 300px";

  return (
    <div
      className={cn("grid gap-1", layout.columns === 3 ? "grid-cols-3" : "grid-cols-2", className)}
      style={gridStyle}
    >
      {media.map((item, i) => renderCell(item, i, layout.cells[i], sizes))}
    </div>
  );
}
