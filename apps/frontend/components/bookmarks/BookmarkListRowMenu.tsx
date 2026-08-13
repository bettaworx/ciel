"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { BookmarkListFormDialog } from "@/components/bookmarks/BookmarkListFormDialog";
import {
  useDeleteBookmarkList,
  type BookmarkList,
} from "@/lib/hooks/use-bookmarks";

interface BookmarkListRowMenuProps {
  list: BookmarkList;
  onDeleted?: () => void;
}

/**
 * Rename / re-icon / delete for one list. Dropdown on desktop, bottom sheet on
 * mobile, matching the post card's menus.
 *
 * The default list offers no delete item at all — the server rejects it, and an
 * option that always fails is worse than no option.
 */
export function BookmarkListRowMenu({ list, onDeleted }: BookmarkListRowMenuProps) {
  const t = useTranslations("bookmarks");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const remove = useDeleteBookmarkList();

  // Opening a dialog straight out of onSelect loses the race with the menu's
  // own teardown, which dismisses the dialog again the moment it mounts. Record
  // the choice instead and act once the menu has finished closing.
  const pendingRef = React.useRef<"edit" | "delete" | null>(null);
  const runPendingAction = () => {
    const action = pendingRef.current;
    pendingRef.current = null;
    if (action === "edit") setEditOpen(true);
    if (action === "delete") setConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(list.id);
      setConfirmOpen(false);
      onDeleted?.();
    } catch {
      toast.error(t("deleteError"));
    }
  };

  const trigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
      aria-label={t("listActions")}
      onClick={(event) => event.stopPropagation()}
    >
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  );

  const confirmText = t("deleteConfirm", {
    name: list.name ?? t("defaultListName"),
    count: list.postCount,
  });

  const destructiveClass =
    "!text-destructive focus:!text-destructive focus:!bg-destructive/10 hover:!text-destructive hover:!bg-destructive/10 [&>svg]:!text-destructive";

  return (
    <>
      {isDesktop ? (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={runPendingAction}>
            <DropdownMenuItem
              onSelect={() => {
                pendingRef.current = "edit";
              }}
            >
              <Pencil className="h-4 w-4" />
              {t("editList")}
            </DropdownMenuItem>
            {!list.isDefault && (
              <DropdownMenuItem
                onSelect={() => {
                  pendingRef.current = "delete";
                }}
                className={destructiveClass}
              >
                <Trash2 className="h-4 w-4" />
                {t("deleteList")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="sr-only">{t("listActions")}</DrawerTitle>
            <div className="flex flex-col gap-2 p-2 pb-4">
              {/* The sheet closes and the dialog opens in the same commit, the
                  way PostCard's delete does. Only the dropdown needs the
                  deferred hand-off. */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                {t("editList")}
              </Button>
              {!list.isDefault && (
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 ${destructiveClass}`}
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("deleteList")}
                </Button>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <BookmarkListFormDialog open={editOpen} onOpenChange={setEditOpen} list={list} />

      {isDesktop ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteList")}</AlertDialogTitle>
              <AlertDialogDescription>{confirmText}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={remove.isPending}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  // Keep the dialog up until the request settles, so a failure
                  // can surface instead of the row silently staying put.
                  event.preventDefault();
                  void handleDelete();
                }}
                disabled={remove.isPending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t("deleteList")}</DrawerTitle>
              <DrawerDescription>{confirmText}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={remove.isPending}
              >
                {t("delete")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={remove.isPending}
              >
                {t("cancel")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
