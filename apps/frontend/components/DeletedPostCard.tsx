"use client";

import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  Copy,
  EyeOff,
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
import { PostPlaceholderCard } from "@/components/PostPlaceholderCard";

type DeletedPostCardProps = {
  referenceId: string;
  variant?: "embedded" | "timeline";
  isLast?: boolean;
  indicator?: PostCardIndicator;
  /**
   * The post still exists; this viewer just may not read it, because its author
   * is private or has blocked them. Same card, different words: telling someone
   * a post was deleted when it was not is the one thing this card must not do.
   */
  restricted?: boolean;
};

export function DeletedPostCard({
  referenceId,
  variant = "embedded",
  isLast = false,
  indicator,
  restricted = false,
}: DeletedPostCardProps) {
  const locale = useLocale() as "ja" | "en";
  const t = useTranslations("postCard");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isEmbedded = variant === "embedded";
  const auth = useAtomValue(authAtom);
  const deletePost = useDeletePost();
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);
  const PlaceholderIcon = restricted ? EyeOff : Trash2;
  const placeholderLabel = restricted
    ? t("restrictedPost.label")
    : t("deletedPost.label");
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

  // Copying the id of a post the viewer is not allowed to read hands them the
  // one thing the restriction was meant to withhold, so a restricted card offers
  // no menu at all — unless the boost is the viewer's own, where the menu is the
  // only way to take it back and would otherwise strand them with a boost they
  // cannot undo.
  const showMenu = !restricted || canUndoBoost;
  const showCopyPostId = !restricted;

  const menuNode = !showMenu ? undefined : (isDesktop ? (
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
        {showCopyPostId && (
          <DropdownMenuItem onSelect={handleCopyPostId}>
            <Copy className="h-4 w-4" />
            {t("actions.copyPostIdFull")}
          </DropdownMenuItem>
        )}
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
          {showCopyPostId && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleCopyPostId}
            >
              <Copy className="h-4 w-4" />
              {t("actions.copyPostIdFull")}
            </Button>
          )}
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

  return (
    <PostPlaceholderCard
      icon={PlaceholderIcon}
      label={placeholderLabel}
      indicator={indicatorNode}
      // Without an indicator strip there is nowhere else for the menu to live,
      // so it moves onto the row itself. With one, PostCardIndicatorRow already
      // renders it and a second copy would be two menus on one card.
      action={!indicator ? menuNode : undefined}
      isLast={isLast}
      embedded={isEmbedded}
    />
  );
}
