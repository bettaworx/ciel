"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Proportions, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { ASPECT_RATIO_OPTIONS, type AspectRatioId } from "./aspectRatios";

interface AspectRatioSelectorProps {
  value: AspectRatioId;
  onChange: (id: AspectRatioId) => void;
  triggerClassName?: string;
  disabled?: boolean;
}

export function AspectRatioSelector({
  value,
  onChange,
  triggerClassName,
  disabled,
}: AspectRatioSelectorProps) {
  const t = useTranslations("imageCrop");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      disabled={disabled}
      aria-label={t("aspectRatio")}
      className={cn("h-8 w-8", triggerClassName)}
    >
      <Proportions className="w-4 h-4" />
    </Button>
  );

  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[80]">
          {ASPECT_RATIO_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.id}
              onClick={() => onChange(opt.id)}
            >
              {t(opt.labelKey)}
              {value === opt.id && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="z-[80]" overlayClassName="z-[80]">
        <div className="flex flex-col gap-1 p-2 pb-4">
          {ASPECT_RATIO_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                onChange(opt.id);
                setDrawerOpen(false);
              }}
            >
              {t(opt.labelKey)}
              {value === opt.id && <Check className="ml-auto h-4 w-4" />}
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
