"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { LocalImage } from "./types";

interface ImagePreviewProps {
  image: LocalImage;
  onRemove: (localId: string) => void;
  disabled: boolean;
}

/**
 * Image preview component with delete button
 */
export function ImagePreview({
  image,
  onRemove,
  disabled,
}: ImagePreviewProps) {
  const t = useTranslations();

  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted group">
      <Image
        src={image.previewUrl}
        alt="Upload preview"
        fill
        unoptimized
        className="object-cover"
        sizes="80px"
      />
      <button
        onClick={() => onRemove(image.localId)}
        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={t("createPost.removeImage")}
        disabled={disabled}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
