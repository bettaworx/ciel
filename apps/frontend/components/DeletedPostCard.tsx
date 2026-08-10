"use client";

import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  Copy,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDeletePost } from "@/lib/hooks/use-queries";
import {
  PostCardIndicatorRow,
  type PostCardIndicator,
} from "@/components/PostCardIndicatorRow";

type DeletedPostCardProps = {
  referenceId: string;
  variant?: "embedded" | "timeline";
  isLast?: boolean;
  indicator?: PostCardIndicator;
};

export function DeletedPostCard({
  referenceId,
  variant = "embedded",
  isLast = false,
  indicator,
}: DeletedPostCardProps) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("postCard");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isEmbedded = variant === "embedded";
  const auth = useAtomValue(authAtom);
  const deletePost = useDeletePost();
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);
  const canUndoBoost =
    indicator?.actorUserId != null &&
    indicator.actorUserId === auth.user?.id;

  const handleCopyPostId = useCallback(() => {
    navigator.clipboard.writeText(referenceId).then(
      () => toast.success(t("copyPostIdSuccess")),
      () => toast.error(t("copyPostIdError")),
    );
  }, [referenceId, t]);

  const handleUndoBoost = useCallback(async () => {
    if (!indicator?.sourcePostId) return;
    setIndicatorMenuOpen(false);
    try {
      await deletePost.mutateAsync(indicator.sourcePostId);
      toast.success(t("actions.undoBoostSuccess"));
    } catch {
      toast.error(t("actions.undoBoostError"));
    }
  }, [indicator?.sourcePostId, deletePost, t]);

  const menuNode = (isDesktop ? (
    <DropdownMenu open={indicatorMenuOpen} onOpenChange={setIndicatorMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-my-4 h-8 w-8 p-0 transition-colors duration-160 ease"
          aria-label={t("actions.more")}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={handleCopyPostId}>
          <Copy className="h-4 w-4" />
          {t("actions.copyPostIdFull")}
        </DropdownMenuItem>
        {canUndoBoost && (
          <DropdownMenuItem onSelect={handleUndoBoost}>
            <RotateCcw className="h-4 w-4" />
            {t("actions.undoBoost")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Drawer open={indicatorMenuOpen} onOpenChange={setIndicatorMenuOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-my-4 h-8 w-8 p-0 transition-colors duration-160 ease"
          aria-label={t("actions.more")}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex flex-col gap-2 p-2 pb-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleCopyPostId}
          >
            <Copy className="h-4 w-4" />
            {t("actions.copyPostIdFull")}
          </Button>
          {canUndoBoost && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleUndoBoost}
            >
              <RotateCcw className="h-4 w-4" />
              {t("actions.undoBoost")}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  ));

  const indicatorNode = indicator && (
    <PostCardIndicatorRow
      indicator={indicator}
      locale={locale}
      menuNode={indicator.sourcePostId ? menuNode : undefined}
    />
  );

  const displayName = t("deletedPost.username");

  return (
    <article
      className={cn(
        "relative text-card-foreground p-3 transition-colors",
        !isLast && !isEmbedded && "border-b border-border",
        isEmbedded && "border border-border rounded-xl overflow-hidden",
      )}
    >
      {indicatorNode}

      {isEmbedded ? (
        <div className="flex flex-col items-center justify-center py-4">
          <Trash2 className="h-8 w-8 text-muted-foreground" />
          <span className="mt-1.5 text-sm text-muted-foreground">
            {t("deletedPost.label")}
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0">
            <AvatarImage src="/assets/Default-Avatar.png" alt={displayName} />
            <AvatarFallback>{t("deletedPost.initials")}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex max-w-full min-w-0 items-center gap-1.5 overflow-hidden">
              <span className="block max-w-full min-w-0 truncate overflow-hidden whitespace-nowrap text-left font-semibold text-foreground text-sm sm:text-base">
                {displayName}
              </span>
              {!indicator && menuNode}
            </div>
            <div className="flex flex-col items-center justify-center py-6">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
              <span className="mt-1.5 text-sm text-muted-foreground">
                {t("deletedPost.label")}
              </span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
