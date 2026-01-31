"use client";

import * as React from "react";
import { SmilePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
} from "@/components/ui/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
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

  const handleEmojiSelect = React.useCallback(
    ({ emoji }: { emoji: string }) => {
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
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease"
            aria-label={t("addReaction")}
          >
            <SmilePlus className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0" align="start">
          <EmojiPicker
            className="h-[342px] w-fit"
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
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors duration-160 ease"
          aria-label={t("addReaction")}
        >
          <SmilePlus className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full flex flex-col">
          <EmojiPicker
            className="w-full h-[400px] border-0"
            columns={12}
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
