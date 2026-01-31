"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ReactionBadgeProps {
  emoji: string;
  count: number;
  isReacted: boolean; // 現在のユーザーがリアクション済みか
  onToggle: () => void;
  disabled?: boolean;
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
}: ReactionBadgeProps) {
  const t = useTranslations("reactions");

  return (
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
}
