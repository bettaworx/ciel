"use client";

import { useEffect, useState } from "react";
import { Copy, Eraser, Pencil, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";
import {
  addRecentDrawingColor,
  DRAWING_BRUSHES,
  parseDrawingDocument,
  type DrawingBrush,
  type DrawingTool,
} from "./drawing";

type Drawing = components["schemas"]["Drawing"];

const RECENT_PENCIL_COLORS_KEY = "ciel:drawing:recent-pencil-colors";
const RECENT_BACKGROUND_COLORS_KEY = "ciel:drawing:recent-background-colors";

function readRecentColors(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter((color): color is string => /^#[0-9A-Fa-f]{6}$/.test(color)).slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function useRecentColors(key: string) {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => setColors(readRecentColors(key)), [key]);

  const remember = (color: string) => {
    setColors((current) => {
      const next = addRecentDrawingColor(current, color);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Color history is optional when storage is unavailable.
      }
      return next;
    });
  };

  return [colors, remember] as const;
}

function RecentColors({
  colors,
  label,
  onSelect,
}: {
  colors: string[];
  label: string;
  onSelect: (color: string) => void;
}) {
  if (colors.length === 0) return null;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className="h-8 w-8 rounded-full border-2 border-background shadow-sm ring-1 ring-foreground/70 ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ backgroundColor: color }}
            aria-label={`${label}: ${color}`}
            onClick={() => onSelect(color)}
          />
        ))}
      </div>
    </div>
  );
}

interface ToolButtonProps {
  tool: DrawingTool;
  activeTool: DrawingTool;
  onSelect: (tool: DrawingTool) => void;
  size: number;
  onSizeChange: (size: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
  className?: string;
  brush?: DrawingBrush;
  onBrushChange?: (brush: DrawingBrush) => void;
}

function BrushPreview({ brush }: { brush: DrawingBrush }) {
  const path = "M2 14 C12 3 22 3 32 14 S52 25 62 14";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 28"
      className="h-7 w-16 shrink-0"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {brush === "gpen" ? (
        <>
          <path d="M2 14 C8 7 14 4 20 6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M20 6 C28 8 31 21 40 21" stroke="currentColor" strokeWidth="4.5" />
          <path d="M40 21 C48 20 54 11 62 14" stroke="currentColor" strokeWidth="2.5" />
        </>
      ) : (
        <path
          d={path}
          stroke="currentColor"
          strokeWidth={brush === "round" ? 4 : 2.25}
          opacity={brush === "pencil" ? 0.58 : 1}
        />
      )}
    </svg>
  );
}

function ToolButton({
  tool,
  activeTool,
  onSelect,
  size,
  onSizeChange,
  min,
  max,
  disabled,
  className,
  brush,
  onBrushChange,
}: ToolButtonProps) {
  const t = useTranslations("createPost.drawing");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [open, setOpen] = useState(false);
  const active = activeTool === tool;
  const Icon = tool === "pencil" ? Pencil : Eraser;
  const label = t(tool);

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      onClick={() => {
        if (active) setOpen(true);
        else onSelect(tool);
      }}
      className={cn(
        "text-muted-foreground hover:text-foreground",
        active && "bg-c-2/10 text-c-1 hover:bg-c-2/15 hover:text-c-2",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const controls = (
    <div className="space-y-3 p-1">
      {tool === "pencil" && brush && onBrushChange && (
        <div className="space-y-2">
          <Label>{t("brush")}</Label>
          <div className="grid gap-1">
            {DRAWING_BRUSHES.map((item) => (
              <Button
                key={item}
                type="button"
                variant={brush === item ? "secondary" : "ghost"}
                size="sm"
                className="h-11 justify-between gap-3 px-3"
                onClick={() => onBrushChange(item)}
              >
                <span>{t(`brushes.${item}`)}</span>
                <BrushPreview brush={item} />
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={`drawing-${tool}-size`}>{t("size", { tool: label })}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{size}px</span>
      </div>
      <Slider
        id={`drawing-${tool}-size`}
        min={min}
        max={max}
        step={1}
        value={[size]}
        onValueChange={([value]) => onSizeChange(value)}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>{button}</PopoverAnchor>
        <PopoverContent align="start" className="z-[70] w-64 p-3">
          {controls}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {button}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="z-[70]" overlayClassName="z-[69]">
          <DrawerTitle className="sr-only">{t("size", { tool: label })}</DrawerTitle>
          <div className="p-4 pb-6">{controls}</div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

interface DrawingToolButtonsProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  brush: DrawingBrush;
  onBrushChange: (brush: DrawingBrush) => void;
  background: string;
  onBackgroundChange: (color: string) => void;
  pencilSize: number;
  onPencilSizeChange: (size: number) => void;
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  sourceDrawing?: Drawing | null;
  disabled?: boolean;
  className?: string;
}

export function DrawingToolButtons({
  tool,
  onToolChange,
  color,
  onColorChange,
  brush,
  onBrushChange,
  background,
  onBackgroundChange,
  pencilSize,
  onPencilSizeChange,
  eraserSize,
  onEraserSizeChange,
  sourceDrawing,
  disabled,
  className,
}: DrawingToolButtonsProps) {
  const t = useTranslations("createPost.drawing");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [colorOpen, setColorOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [sourceColor, setSourceColor] = useState<string | null>(null);
  const [recentColors, rememberColor] = useRecentColors(RECENT_PENCIL_COLORS_KEY);
  const [recentBackgrounds, rememberBackground] = useRecentColors(RECENT_BACKGROUND_COLORS_KEY);
  const sourceReplayUrl = sourceDrawing?.replayUrl;

  useEffect(() => {
    setSourceColor(null);
    if (!sourceReplayUrl) return;
    const controller = new AbortController();
    void fetch(sourceReplayUrl, { credentials: "include", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Drawing replay request failed: ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((value) => {
        const document = parseDrawingDocument(value);
        if (document) setSourceColor(document.color);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Source drawing color request failed:", error);
        }
      });
    return () => controller.abort();
  }, [sourceReplayUrl]);

  const selectColor = (next: string) => {
    onColorChange(next);
    rememberColor(next);
  };
  const selectBackground = (next: string) => {
    onBackgroundChange(next);
    rememberBackground(next);
  };

  const colorButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      aria-label={t("color")}
      onClick={() => setColorOpen(true)}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <span
        aria-hidden
        className="h-4 w-4 rounded-full border-2 border-foreground/70"
        style={{ backgroundColor: color }}
      />
    </Button>
  );

  const colorControl = (
    <div className="space-y-3 p-1">
      <Label htmlFor="drawing-color">{t("color")}</Label>
      <ColorPicker
        id="drawing-color"
        value={color}
        onValueChange={onColorChange}
        onValueCommit={rememberColor}
        ariaLabel={t("color")}
      />
      {sourceDrawing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          disabled={!sourceColor}
          onClick={() => sourceColor && selectColor(sourceColor)}
        >
          <Copy className="h-4 w-4" />
          {t("copyFromSource")}
        </Button>
      )}
      <RecentColors colors={recentColors} label={t("recentColors")} onSelect={selectColor} />
    </div>
  );

  const backgroundButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      aria-label={t("background")}
      onClick={() => setBackgroundOpen(true)}
      className={cn("text-muted-foreground hover:text-foreground", className)}
    >
      <span
        aria-hidden
        className="h-4 w-4 rounded-sm border-2 border-foreground/70"
        style={{ backgroundColor: background }}
      />
    </Button>
  );

  const backgroundControl = (
    <div className="space-y-3 p-1">
      <Label htmlFor="drawing-background">{t("background")}</Label>
      <ColorPicker
        id="drawing-background"
        value={background}
        onValueChange={onBackgroundChange}
        onValueCommit={rememberBackground}
        ariaLabel={t("background")}
      />
      {sourceDrawing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => selectBackground(sourceDrawing.backgroundColor)}
        >
          <Copy className="h-4 w-4" />
          {t("copyFromSource")}
        </Button>
      )}
      <RecentColors
        colors={recentBackgrounds}
        label={t("recentColors")}
        onSelect={selectBackground}
      />
    </div>
  );

  return (
    <div className="flex items-center gap-1">
      <ToolButton
        tool="pencil"
        activeTool={tool}
        onSelect={onToolChange}
        size={pencilSize}
        onSizeChange={onPencilSizeChange}
        min={1}
        max={48}
        brush={brush}
        onBrushChange={onBrushChange}
        disabled={disabled}
        className={className}
      />
      <ToolButton
        tool="eraser"
        activeTool={tool}
        onSelect={onToolChange}
        size={eraserSize}
        onSizeChange={onEraserSizeChange}
        min={4}
        max={128}
        disabled={disabled}
        className={className}
      />
      <Separator orientation="vertical" className="mx-1 h-5 w-[2px] rounded-full" />
      {isDesktop ? (
        <>
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverAnchor asChild>{colorButton}</PopoverAnchor>
            <PopoverContent align="start" className="z-[70] w-64 p-3">
              {colorControl}
            </PopoverContent>
          </Popover>
          <Popover open={backgroundOpen} onOpenChange={setBackgroundOpen}>
            <PopoverAnchor asChild>{backgroundButton}</PopoverAnchor>
            <PopoverContent align="start" className="z-[70] w-64 p-3">
              {backgroundControl}
            </PopoverContent>
          </Popover>
        </>
      ) : (
        <>
          {colorButton}
          <Drawer open={colorOpen} onOpenChange={setColorOpen}>
            <DrawerContent className="z-[70]" overlayClassName="z-[69]">
              <DrawerTitle className="sr-only">{t("color")}</DrawerTitle>
              <div className="p-4 pb-6">{colorControl}</div>
            </DrawerContent>
          </Drawer>
          {backgroundButton}
          <Drawer open={backgroundOpen} onOpenChange={setBackgroundOpen}>
            <DrawerContent className="z-[70]" overlayClassName="z-[69]">
              <DrawerTitle className="sr-only">{t("background")}</DrawerTitle>
              <div className="p-4 pb-6">{backgroundControl}</div>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  );
}

interface DrawingHistoryButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  disabled?: boolean;
  className?: string;
}

export function DrawingHistoryButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  disabled,
  className,
}: DrawingHistoryButtonsProps) {
  const t = useTranslations("createPost.drawing");
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || !canUndo}
        onClick={onUndo}
        aria-label={t("undo")}
        className={className}
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || !canRedo}
        onClick={onRedo}
        aria-label={t("redo")}
        className={className}
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
