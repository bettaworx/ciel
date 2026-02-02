"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { LocalImage } from "./types";

interface ImagePreviewProps {
  image: LocalImage;
  onRemove: (localId: string) => void;
  disabled: boolean;
  onPreview?: () => void;
}

/**
 * Image preview component with delete button
 */
export function ImagePreview({
  image,
  onRemove,
  disabled,
  onPreview,
}: ImagePreviewProps) {
  const t = useTranslations();
  const tLightbox = useTranslations("lightbox");

  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted group">
      {onPreview ? (
        <button
          type="button"
          onClick={onPreview}
          className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={tLightbox("open")}
        >
          <Image
            src={image.previewUrl}
            alt={tLightbox("imageAlt")}
            fill
            unoptimized
            className="object-cover"
            sizes="80px"
          />
        </button>
      ) : (
        <Image
          src={image.previewUrl}
          alt={tLightbox("imageAlt")}
          fill
          unoptimized
          className="object-cover"
          sizes="80px"
        />
      )}
      <button
        onClick={(event) => {
          event.stopPropagation();
          onRemove(image.localId);
        }}
        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={t("createPost.removeImage")}
        disabled={disabled}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
