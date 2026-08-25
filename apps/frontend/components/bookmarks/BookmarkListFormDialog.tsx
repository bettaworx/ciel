"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
  type EmojiSelectEvent,
} from "@/components/ui/emoji-picker";
import { EmojiInline } from "@/components/EmojiInline";
import {
  useCreateBookmarkList,
  useUpdateBookmarkList,
  type BookmarkList,
} from "@/lib/hooks/use-bookmarks";

const DEFAULT_ICON = "🔖";
const MAX_NAME_LENGTH = 50;

interface BookmarkListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new list. */
  list?: BookmarkList;
  onCreated?: (list: BookmarkList) => void;
}

/**
 * Create or edit a bookmark list. One component for both, because the fields
 * and the validation are identical and only the request differs.
 *
 * Laid out like iOS's Focus setup: one large tappable icon above the name, so
 * the icon reads as the thing being named rather than a field beside it.
 * Desktop gets a dialog, mobile a bottom sheet.
 */
export function BookmarkListFormDialog({
  open,
  onOpenChange,
  list,
  onCreated,
}: BookmarkListFormDialogProps) {
  const t = useTranslations("bookmarks");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isEdit = list !== undefined;
  const create = useCreateBookmarkList();
  const update = useUpdateBookmarkList();
  const isPending = create.isPending || update.isPending;

  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState(DEFAULT_ICON);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // Reset on open rather than on mount: the dialog stays mounted between uses,
  // so a stale name from the previous list would otherwise carry over.
  React.useEffect(() => {
    if (!open) return;
    // A default list has no stored name; offer its translated label so renaming
    // it starts from what the user actually sees.
    setName(list ? (list.name ?? t("defaultListName")) : "");
    setIcon(list?.icon ?? DEFAULT_ICON);
    setPickerOpen(false);
  }, [open, list, t]);

  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH && !isPending;

  const handleEmojiSelect = React.useCallback(({ emoji }: EmojiSelectEvent) => {
    setIcon(emoji);
    setPickerOpen(false);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      if (isEdit) {
        await update.mutateAsync({ listId: list.id, name: trimmed, icon });
      } else {
        const created = await create.mutateAsync({ name: trimmed, icon });
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? t("updateError") : t("createError"));
    }
  };

  const iconButton = (
    <Button
      type="button"
      variant="secondary"
      // The emoji is an image sized in em, so font-size is what scales it.
      // leading-none keeps the line box from pushing it off centre; the button
      // is already a flex box, so vertical-align never enters into it.
      className="h-24 w-24 rounded-full p-0 text-[2.75rem] leading-none"
      aria-label={t("listIcon")}
    >
      <EmojiInline emoji={icon} />
    </Button>
  );

  const picker = (
    <EmojiPicker
      // The sheet has to yield to the keyboard; the desktop popover has no
      // keyboard to yield to and keeps its fixed height.
      className="h-[min(400px,calc(100dvh-var(--keyboard-inset,0px)-8rem))] w-full sm:h-[360px] sm:w-[340px]"
      columns={isDesktop ? 8 : 8}
      onEmojiSelect={handleEmojiSelect}
    >
      <EmojiPickerSearch />
      <EmojiPickerContent />
      <EmojiPickerFooter />
    </EmojiPicker>
  );

  const fields = (
    <div className="flex flex-col items-center gap-6 py-4">
      {isDesktop ? (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>{iconButton}</PopoverTrigger>
          <PopoverContent className="w-fit overflow-hidden p-0" align="center">
            {picker}
          </PopoverContent>
        </Popover>
      ) : (
        // Nested, so the sheet underneath stays put while the picker is up.
        <Drawer nested open={pickerOpen} onOpenChange={setPickerOpen}>
          <DrawerTrigger asChild>{iconButton}</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="sr-only">{t("listIcon")}</DrawerTitle>
            {picker}
          </DrawerContent>
        </Drawer>
      )}

      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="off"
        placeholder={t("listNamePlaceholder")}
        aria-label={t("listName")}
        className="h-11 text-center"
      />
    </div>
  );

  const actions = (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onOpenChange(false)}
        disabled={isPending}
      >
        {t("cancel")}
      </Button>
      <Button type="submit" variant="primary" disabled={!canSubmit}>
        {isEdit ? t("save") : t("create")}
      </Button>
    </>
  );

  const title = isEdit ? t("editList") : t("createList");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {/* The icon and the name field say everything the form does. */}
              <DialogDescription className="sr-only">{title}</DialogDescription>
            </DialogHeader>
            {fields}
            <DialogFooter>{actions}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form onSubmit={handleSubmit} className="px-4 pb-4">
          <DrawerHeader className="px-0">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription className="sr-only">{title}</DrawerDescription>
          </DrawerHeader>
          {fields}
          <DrawerFooter className="flex-row justify-end px-0">
            {actions}
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
