"use client";

import { useTranslations } from "next-intl";
import { X, Film } from "lucide-react";
import type { LocalVideo } from "./types";

interface VideoPreviewProps {
  video: LocalVideo;
  onRemove: () => void;
  disabled: boolean;
}

/**
 * Video preview component with delete button
 * Shows a video thumbnail using the blob URL and a film icon overlay
 */
export function VideoPreview({ video, onRemove, disabled }: VideoPreviewProps) {
  const t = useTranslations();

  return (
    <div className="relative w-40 h-24 rounded-xl overflow-hidden bg-muted group">
      <video
        src={video.previewUrl}
        className="w-full h-full object-cover"
        muted
        preload="metadata"
      />
      {/* Film icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black/40 rounded-full p-1.5">
          <Film className="w-5 h-5 text-white" />
        </div>
      </div>
      {/* Remove button */}
      <button
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={t("createPost.removeVideo")}
        disabled={disabled}
      >
        <X className="w-3 h-3" />
      </button>
      {/* File name */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white truncate">
        {video.file.name}
      </div>
    </div>
  );
}
