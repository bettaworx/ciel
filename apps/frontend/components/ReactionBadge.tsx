"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ReactionUserButton } from "@/components/ReactionUserButton";
import type { components } from "@/lib/api/api";
import { useReactionUsers, useReactionUsersPreview } from "@/lib/hooks/use-reaction-users";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ReactionBadgeProps {
  emoji: string;
  count: number;
  isReacted: boolean; // 現在のユーザーがリアクション済みか
  onToggle: () => void;
  disabled?: boolean;
  postId: components["schemas"]["PostId"];
}

/**
 * Slack/Discord風のリアクションバッジ
 * クリックでリアクションの追加/削除をトグル
 */
export function ReactionBadge({
  emoji,
  count,
  isReacted,
  onToggle,
  disabled = false,
  postId,
}: ReactionBadgeProps) {
  const t = useTranslations("reactions");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [hoverOpen, setHoverOpen] = React.useState(false);

  const preview = useReactionUsersPreview({
    postId,
    emoji,
    enabled: hoverOpen,
  });
  const fullList = useReactionUsers({
    postId,
    emoji,
    enabled: dialogOpen,
  });

  const previewUsers = preview.data?.users ?? [];
  const fullUsers = fullList.data?.pages.flatMap((page) => page.users) ?? [];
  const hasMore = Boolean(fullList.data?.pages.at(-1)?.nextCursor);

  const button = (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        // ベーススタイル
        "h-8 px-2.5 py-1 rounded-full transition-colors duration-160 ease",
        "flex items-center gap-1.5 pr-3.5",

        // 状態別スタイル
        isReacted
          ? [
              // リアクション済み: テーマカラー
              "bg-c-9 text-c-foreground-1",
              "hover:bg-c-8 hover:text-c-foreground-1",
            ]
          : [
              // 未リアクション: ミュート色
              "bg-muted text-muted-foreground border-border",
              "hover:bg-accent hover:text-muted-foreground hover:border-border",
            ],
      )}
      aria-label={
        isReacted
          ? t("labelWithYourReaction", { emoji, count })
          : t("label", { emoji, count })
      }
      aria-pressed={isReacted}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-sm font-medium tabular-nums">{count}</span>
    </Button>
  );

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(next) => {
        setDialogOpen(next);
        if (next) {
          setHoverOpen(false);
        }
      }}
    >
      <HoverCard open={hoverOpen} onOpenChange={setHoverOpen}>
        <HoverCardTrigger asChild>{button}</HoverCardTrigger>
        <HoverCardContent className="w-64 p-2">
          <div className="flex flex-col gap-1">
            {preview.isLoading && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                {t("loadingUsers")}
              </span>
            )}
            {!preview.isLoading && previewUsers.length === 0 && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                {t("noUsers")}
              </span>
            )}
            {previewUsers.map((user) => (
              <ReactionUserButton key={user.id} user={user} />
            ))}
            {previewUsers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start px-2"
                onClick={() => setDialogOpen(true)}
              >
                {t("viewAll")}
              </Button>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      <DialogContent className="max-w-md p-4">
        <div className="flex flex-col gap-2">
          {fullList.isLoading && (
            <span className="px-2 py-1 text-sm text-muted-foreground">
              {t("loadingUsers")}
            </span>
          )}
          {!fullList.isLoading && fullUsers.length === 0 && (
            <span className="px-2 py-1 text-sm text-muted-foreground">
              {t("noUsers")}
            </span>
          )}
          {fullUsers.map((user) => (
            <ReactionUserButton key={user.id} user={user} />
          ))}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => fullList.fetchNextPage()}
              disabled={fullList.isFetchingNextPage}
            >
              {fullList.isFetchingNextPage ? t("loadingMore") : t("loadMore")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
