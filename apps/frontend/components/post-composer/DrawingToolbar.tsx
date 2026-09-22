"use client";

import { useState } from "react";
import { Eraser, Pencil, Redo2, Undo2 } from "lucide-react";
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
import type { DrawingTool } from "./drawing";

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
        <PopoverContent align="start" className="w-64 p-3">
          {controls}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {button}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
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
  background: string;
  onBackgroundChange: (color: string) => void;
  pencilSize: number;
  onPencilSizeChange: (size: number) => void;
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  disabled?: boolean;
  className?: string;
}

export function DrawingToolButtons({
  tool,
  onToolChange,
  color,
  onColorChange,
  background,
  onBackgroundChange,
  pencilSize,
  onPencilSizeChange,
  eraserSize,
  onEraserSizeChange,
  disabled,
  className,
}: DrawingToolButtonsProps) {
  const t = useTranslations("createPost.drawing");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [colorOpen, setColorOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);

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
        ariaLabel={t("color")}
      />
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
        ariaLabel={t("background")}
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
            <PopoverContent align="start" className="w-64 p-3">
              {colorControl}
            </PopoverContent>
          </Popover>
          <Popover open={backgroundOpen} onOpenChange={setBackgroundOpen}>
            <PopoverAnchor asChild>{backgroundButton}</PopoverAnchor>
            <PopoverContent align="start" className="w-64 p-3">
              {backgroundControl}
            </PopoverContent>
          </Popover>
        </>
      ) : (
        <>
          {colorButton}
          <Drawer open={colorOpen} onOpenChange={setColorOpen}>
            <DrawerContent>
              <DrawerTitle className="sr-only">{t("color")}</DrawerTitle>
              <div className="p-4 pb-6">{colorControl}</div>
            </DrawerContent>
          </Drawer>
          {backgroundButton}
          <Drawer open={backgroundOpen} onOpenChange={setBackgroundOpen}>
            <DrawerContent>
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
