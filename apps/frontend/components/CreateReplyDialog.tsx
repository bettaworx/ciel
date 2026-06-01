"use client";

import { User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { userAtom } from "@/atoms/auth";
import { useComposePost } from "./post-composer/useComposePost";
import { PostComposerContent } from "./post-composer/PostComposerContent";

interface CreateReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  contentPrefix?: string;
}

export function CreateReplyDialog({
  open,
  onOpenChange,
  parentId,
  contentPrefix,
}: CreateReplyDialogProps) {
  const t = useTranslations();
  const user = useAtomValue(userAtom);

  const compose = useComposePost({
    parentId,
    contentPrefix,
    onSuccess: () => onOpenChange(false),
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (compose.createPostMutation.isPending || compose.isUploading)) {
      return;
    }
    onOpenChange(newOpen);
  };

  const avatarElement = (
    <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0">
      {user?.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt={user?.username} />
      ) : (
        <AvatarFallback>
          <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
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
        <DialogTitle className="sr-only">{t("createPost.replyTitle")}</DialogTitle>

        <PostComposerContent
          layout="dialog"
          compose={compose}
          avatar={avatarElement}
          onClose={() => handleOpenChange(false)}
          closeDisabled={compose.createPostMutation.isPending || compose.isUploading}
          placeholder={t("createPost.replyPlaceholder")}
          submitLabel={t("createPost.reply")}
          submittingLabel={t("createPost.replying")}
        />
      </DialogContent>
    </Dialog>
  );
}
