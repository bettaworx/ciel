"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ReactionUserButton } from "@/components/ReactionUserButton";
import type { components } from "@/lib/api/api";
import { useReactionUsersPreview } from "@/lib/hooks/use-reaction-users";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ReactionBadgeProps {
  emoji: string;
  count: number;
  isReacted: boolean; // 現在のユーザーがリアクション済みか
  onToggle: () => void;
  disabled?: boolean;
  postId: components["schemas"]["PostId"];
  onOpenDialog?: (emoji: string) => void;
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
  onOpenDialog,
}: ReactionBadgeProps) {
  const t = useTranslations("reactions");
  const [hoverOpen, setHoverOpen] = React.useState(false);

  const preview = useReactionUsersPreview({
    postId,
    emoji,
    enabled: hoverOpen,
  });
  const previewUsers = preview.data?.users ?? [];
  const remainingCount = Math.max(0, count - previewUsers.length);

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
          {!preview.isLoading && remainingCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-2"
              onClick={() => {
                setHoverOpen(false);
                onOpenDialog?.(emoji);
              }}
            >
              {t("viewRemaining", { count: remainingCount })}
            </Button>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
