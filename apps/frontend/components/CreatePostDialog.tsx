"use client";

import { User as UserIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { isCreatePostShortcut } from "@/lib/create-post-shortcut";
import { useAtomValue } from "jotai";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { userAtom } from "@/atoms/auth";
import { useComposePost } from "./post-composer/useComposePost";
import { PostComposerContent } from "./post-composer/PostComposerContent";
import { useDrawingDialogClose } from "./post-composer/useDrawingDialogClose";

// Types
interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Create Post Dialog Component
 *
 * Features:
 * - Text input with auto-resize (max 400px desktop, 50vh mobile)
 * - Image upload with blob URL preview (max 4 images)
 * - Video upload with blob URL preview (max 1 video)
 * - Character counter with progress ring
 * - Ctrl/Cmd + Enter to post
 * - Responsive layout (600px desktop, full-width mobile with margins)
 */
export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const t = useTranslations();
  const user = useAtomValue(userAtom);

  useEffect(() => {
    if (open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!isCreatePostShortcut(event, target)) return;
      // Leave keyboard interaction inside other overlays to their own controls.
      if (
        target?.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]')
      ) {
        return;
      }

      event.preventDefault();
      onOpenChange(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Use shared composition logic
  const compose = useComposePost({
    onSuccess: () => onOpenChange(false),
  });
  const drawingClose = useDrawingDialogClose(compose, () => onOpenChange(false));

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) onOpenChange(true);
    else drawingClose.requestClose();
  };

  // Static (non-interactive) avatar for the dialog
  const avatarElement = (
    <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0">
      <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.username} />
      <AvatarFallback>
        <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          onDragOver={compose.handleDragOver}
          onDragEnter={compose.handleDragEnter}
          onDragLeave={compose.handleDragLeave}
          onDrop={compose.handleDrop}
          className="
        sm:max-w-2xl
        gap-0
        p-0
        [&>button]:hidden
        sm:!top-6
        sm:!translate-y-0
        sm:m-6
        max-sm:!m-3
        max-sm:!top-0
        max-sm:!left-0
        max-sm:!right-0
        max-sm:!translate-x-0
        max-sm:!translate-y-0
        max-sm:!max-w-[calc(100vw-24px)]
        max-sm:!w-[calc(100vw-24px)]
        max-sm:rounded-xl
        max-sm:!max-h-[calc(100vh-24px)]
        max-sm:overflow-hidden
        z-[60]
      "
        >
          {/* Visually hidden title for accessibility */}
          <DialogTitle className="sr-only">{t("createPost.title")}</DialogTitle>

          <PostComposerContent
            layout="dialog"
            compose={compose}
            avatar={avatarElement}
            onClose={() => handleOpenChange(false)}
            closeDisabled={compose.createPostMutation.isPending || compose.isUploading}
          />
        </DialogContent>
      </Dialog>
      {drawingClose.confirmation}
    </>
  );
}
