"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
  type EmojiSelectEvent,
} from "@/components/ui/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface ReactionPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

/**
 * レスポンシブ絵文字ピッカー
 * デスクトップ: Popover表示
 * モバイル: Drawer表示
 */
export function ReactionPicker({
  onEmojiSelect,
  disabled,
}: ReactionPickerProps) {
  const t = useTranslations("postCard");
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  useBodyScrollLock(open);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname, searchParamsKey]);

  const handleEmojiSelect = React.useCallback(
    ({ emoji }: EmojiSelectEvent) => {
      onEmojiSelect(emoji);
      setOpen(false);
    },
    [onEmojiSelect],
  );

  // デスクトップ: Popover表示
  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-9 w-9 p-0 text-muted-foreground transition-colors duration-160 ease hover:text-foreground"
            aria-label={t("addReaction")}
          >
            <SmilePlus className="h-5 w-5 sm:h-5 sm:w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit overflow-hidden p-0" align="start">
          <EmojiPicker
            className="h-[400px] w-[400px]"
            columns={9}
            onEmojiSelect={handleEmojiSelect}
          >
            <EmojiPickerSearch placeholder={t("searchEmoji")} />
            <EmojiPickerContent />
            <EmojiPickerFooter />
          </EmojiPicker>
        </PopoverContent>
      </Popover>
    );
  }

  // モバイル: Drawer表示
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-9 w-9 p-0 text-muted-foreground transition-colors duration-160 ease hover:text-foreground"
          aria-label={t("addReaction")}
        >
          <SmilePlus className="h-5 w-5 sm:h-5 sm:w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full flex flex-col">
          <DrawerTitle className="sr-only">{t("addReaction")}</DrawerTitle>
          <EmojiPicker
            className="w-full h-[400px] border-0"
            columns={8}
            onEmojiSelect={handleEmojiSelect}
          >
            <EmojiPickerSearch
              className="w-full"
              placeholder={t("searchEmoji")}
            />
            <EmojiPickerContent className="w-full" />
            <EmojiPickerFooter className="w-full" />
          </EmojiPicker>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
