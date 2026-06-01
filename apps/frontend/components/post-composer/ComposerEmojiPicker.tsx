"use client";

import * as React from "react";
import { Smile } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
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
import { cn } from "@/lib/utils";
import { applyFormatToTextarea } from "./applyFormat";

interface ComposerEmojiPickerProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  setContent: (v: string) => void;
  setSelectionRange: (r: { start: number; end: number }) => void;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
}

export function ComposerEmojiPicker({
  textareaRef,
  content,
  setContent,
  setSelectionRange,
  disabled,
  className,
  iconClassName,
}: ComposerEmojiPickerProps) {
  const t = useTranslations("createPost");
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const handleEmojiSelect = React.useCallback(
    ({ emoji }: EmojiSelectEvent) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const pos = textarea.selectionStart ?? content.length;
      const newContent = content.slice(0, pos) + emoji + content.slice(pos);
      const newPos = pos + emoji.length;
      applyFormatToTextarea(textarea, newContent, newPos, newPos, setContent, setSelectionRange);
    },
    [textareaRef, content, setContent, setSelectionRange],
  );

  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      className={cn("p-0 text-muted-foreground transition-colors duration-160 ease hover:text-foreground", className)}
      aria-label={t("addEmoji")}
    >
      <Smile className={cn("w-5 h-5", iconClassName)} />
    </Button>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
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

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <div className="w-full flex flex-col">
          <DrawerTitle className="sr-only">{t("addEmoji")}</DrawerTitle>
          <EmojiPicker
            className="w-full h-[400px] border-0"
            columns={8}
            onEmojiSelect={handleEmojiSelect}
          >
            <EmojiPickerSearch className="w-full" placeholder={t("searchEmoji")} />
            <EmojiPickerContent className="w-full" />
            <EmojiPickerFooter className="w-full" />
          </EmojiPicker>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
