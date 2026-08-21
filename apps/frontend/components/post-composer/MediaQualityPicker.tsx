"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, FileUp, Gauge, Grid2x2, Scale, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { ImageQualityMode, VideoQualityMode } from "@/lib/media/normalize";

/** Same breakpoint PostMediaPreview uses to tell desktop from touch layouts. */
const DESKTOP = "(min-width: 640px)";

export type QualityMode = ImageQualityMode | VideoQualityMode;

const ICON_FOR: Record<QualityMode, LucideIcon> = {
  none: FileUp,
  "dot-by-dot": Grid2x2,
  performance: Gauge,
  balance: Scale,
  quality: Sparkles,
};

/** Dot-by-dot only means anything for a still: it keeps the original pixels. */
const MODES: Record<"image" | "video", ReadonlyArray<QualityMode>> = {
  image: ["dot-by-dot", "performance", "balance", "quality"],
  video: ["performance", "balance", "quality"],
};

/** i18n key suffix for a mode, so both media kinds share one set of strings. */
const MODE_KEY: Record<QualityMode, string> = {
  none: "None",
  "dot-by-dot": "DotByDot",
  performance: "Performance",
  balance: "Balance",
  quality: "High",
};

/** Trailing tick marking the mode currently in effect. */
function SelectedMark({ selected }: { selected: boolean }) {
  return (
    <Check className={cn("ml-auto h-4 w-4", !selected && "invisible")} />
  );
}

interface MediaQualityControlProps {
  kind: "image" | "video";
  value: QualityMode;
  onChange: (mode: QualityMode) => void;
  /** Offer uploading untouched. Only true when the file already suits the server. */
  allowNone?: boolean;
}

/**
 * Compression control overlaid on an attachment in the composer.
 *
 * Sits in the same disc as the remove button, at the opposite corner, and opens
 * a dropdown on desktop or a sheet on touch — the same split
 * MediaUploadOverflowMenu makes for the upload buttons.
 */
export function MediaQualityControl({
  kind,
  value,
  onChange,
  allowNone = false,
}: MediaQualityControlProps) {
  const t = useTranslations("createPost");
  const isDesktop = useMediaQuery(DESKTOP);
  const [open, setOpen] = useState(false);

  const Icon = ICON_FOR[value];
  const title = t(kind === "video" ? "qualityVideoTitle" : "qualityImageTitle");

  const trigger = (
    <button
      type="button"
      // The cell behind is a lightbox or crop trigger in some layouts.
      onClick={(e) => e.stopPropagation()}
      aria-label={title}
      className="absolute top-2 left-2 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  const modes = allowNone ? ["none" as const, ...MODES[kind]] : MODES[kind];

  if (isDesktop) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {modes.map((mode) => {
            const Row = ICON_FOR[mode];
            return (
              <DropdownMenuItem key={mode} onSelect={() => onChange(mode)}>
                <Row className="h-4 w-4" />
                {t(`quality${MODE_KEY[mode]}`)}
                <SelectedMark selected={mode === value} />
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <div className="flex flex-col gap-1 p-2 pb-4">
          {modes.map((mode) => {
            const Row = ICON_FOR[mode];
            return (
              <Button
                key={mode}
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onChange(mode);
                  setOpen(false);
                }}
              >
                <Row className="h-4 w-4" />
                {t(`quality${MODE_KEY[mode]}`)}
                <SelectedMark selected={mode === value} />
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
