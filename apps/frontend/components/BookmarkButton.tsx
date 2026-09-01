"use client";

import * as React from "react";
import { Bookmark, Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useBookmarkLists, usePostBookmarks } from "@/lib/hooks/use-bookmarks";
import { EmojiInline } from "@/components/EmojiInline";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { BookmarkListFormDialog } from "@/components/bookmarks/BookmarkListFormDialog";

interface BookmarkButtonProps {
  postId: string;
  /** The post's own bookmarkListIds, used to seed the button's state. */
  initialListIds?: string[];
}

/**
 * Saves a post into the caller's bookmark lists. Desktop opens a dropdown of
 * checkboxes, mobile a drawer — the same split the boost menu and the reaction
 * picker already use.
 */
export function BookmarkButton({ postId, initialListIds }: BookmarkButtonProps) {
  const t = useTranslations("postCard");
  const tBookmarks = useTranslations("bookmarks");
  const tCommon = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [open, setOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const openFormOnCloseRef = React.useRef(false);

  const { listIds, isBookmarked, isPending, setLists, toggleList } =
    usePostBookmarks(postId, initialListIds);
  // Only ask for the lists once the menu has been opened: most cards on a
  // timeline are never bookmarked into anything.
  const { data: lists, isLoading } = useBookmarkLists(open || formOpen);

  const handleToggle = (listId: string) => {
    toggleList(listId, {
      onError: (error: Error) => {
        toast.error(
          error.message === "loginRequired"
            ? t("actions.bookmarkLoginRequired")
            : t("actions.bookmarkError"),
        );
      },
    });
  };

  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      className={cn(
        "h-8 w-8 p-0 transition-colors duration-160 ease hover:text-foreground",
        isBookmarked ? "text-foreground" : "text-muted-foreground",
      )}
      aria-label={t("actions.bookmark")}
    >
      <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
    </Button>
  );

  const emptyState = (
    <p className="px-2 py-3 text-center text-sm text-muted-foreground">
      {isLoading ? tCommon("loading") : tBookmarks("noLists")}
    </p>
  );

  const dialog = (
    <BookmarkListFormDialog
      open={formOpen}
      onOpenChange={setFormOpen}
      // A list created from here is what the user wanted the post in.
      onCreated={(list) => setLists([...listIds, list.id])}
    />
  );

  if (isDesktop) {
    return (
      <>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-56"
            // Opening the form straight out of onSelect loses the race with the
            // menu's teardown, which dismisses the new dialog as it mounts.
            onCloseAutoFocus={() => {
              if (!openFormOnCloseRef.current) return;
              openFormOnCloseRef.current = false;
              setFormOpen(true);
            }}
          >
            {/* Plain items rather than DropdownMenuCheckboxItem: that primitive
                pins its indicator to the left, and the check belongs on the
                right here, opposite the icon. */}
            {lists?.length
              ? lists.map((list) => {
                  const checked = listIds.includes(list.id);
                  return (
                    <DropdownMenuItem
                      key={list.id}
                      role="menuitemcheckbox"
                      aria-checked={checked}
                      // Radix closes the menu on select; keep it open so several
                      // lists can be ticked in one go.
                      onSelect={(event) => {
                        event.preventDefault();
                        handleToggle(list.id);
                      }}
                    >
                      <EmojiInline emoji={list.icon} className="h-4 w-4 shrink-0" />
                      <span className="grow truncate">
                        {list.name ?? tBookmarks("defaultListName")}
                      </span>
                      <Check
                        className={cn("h-4 w-4 shrink-0", !checked && "invisible")}
                      />
                    </DropdownMenuItem>
                  );
                })
              : emptyState}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                openFormOnCloseRef.current = true;
              }}
            >
              <span className="grow">{tBookmarks("createList")}</span>
              <Plus className="h-4 w-4 shrink-0" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerTitle className="px-4 pt-4 text-base">
            {t("actions.bookmark")}
          </DrawerTitle>
          <div className="flex flex-col gap-1 p-2 pb-4">
            {lists?.length
              ? lists.map((list) => {
                  const checked = listIds.includes(list.id);
                  return (
                    <Button
                      key={list.id}
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => handleToggle(list.id)}
                    >
                      <EmojiInline emoji={list.icon} className="h-4 w-4 shrink-0" />
                      <span className="grow truncate text-left">
                        {list.name ?? tBookmarks("defaultListName")}
                      </span>
                      <Check
                        className={cn("h-4 w-4 shrink-0", !checked && "invisible")}
                      />
                    </Button>
                  );
                })
              : emptyState}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false);
                setFormOpen(true);
              }}
            >
              <span className="grow text-left">{tBookmarks("createList")}</span>
              <Plus className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
      {dialog}
    </>
  );
}
