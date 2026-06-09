"use client";

import { useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Plus, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface MediaUploadOverflowMenuProps {
  imageFileInputRef: RefObject<HTMLInputElement | null>;
  videoFileInputRef: RefObject<HTMLInputElement | null>;
  isImageUploadDisabled: boolean;
  isVideoUploadDisabled: boolean;
  className?: string;
  iconClassName?: string;
}

export function MediaUploadOverflowMenu({
  imageFileInputRef,
  videoFileInputRef,
  isImageUploadDisabled,
  isVideoUploadDisabled,
  className,
  iconClassName,
}: MediaUploadOverflowMenuProps) {
  const t = useTranslations();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const itemClass = "w-full justify-start gap-2";

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isImageUploadDisabled && isVideoUploadDisabled}
          aria-label={t("createPost.uploadMedia")}
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors duration-160 ease",
            className,
          )}
        >
          <Plus className={iconClassName} />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle className="sr-only">
          {t("createPost.uploadMedia")}
        </DrawerTitle>
        <div className="flex flex-col gap-1 p-2 pb-4">
          <Button
            variant="ghost"
            disabled={isImageUploadDisabled}
            className={itemClass}
            onClick={() => {
              imageFileInputRef.current?.click();
              setDrawerOpen(false);
            }}
          >
            <ImageIcon className="h-4 w-4" />
            {t("createPost.uploadImage")}
          </Button>
          <Button
            variant="ghost"
            disabled={isVideoUploadDisabled}
            className={itemClass}
            onClick={() => {
              videoFileInputRef.current?.click();
              setDrawerOpen(false);
            }}
          >
            <VideoIcon className="h-4 w-4" />
            {t("createPost.uploadVideo")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
