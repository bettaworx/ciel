"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

import { Twemoji } from "@/components/Twemoji";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/i18n/constants";
import {
  resolveEmoji,
  useEmojiData,
} from "@/lib/emoji-picker/use-emoji-data";

const SKIN_TONE_OPTIONS = [
  { value: "0", label: "デフォルト", sample: "👋" },
  { value: "1", label: "薄い肌色", sample: "👋🏻" },
  { value: "2", label: "やや薄い肌色", sample: "👋🏼" },
  { value: "3", label: "中間の肌色", sample: "👋🏽" },
  { value: "4", label: "やや濃い肌色", sample: "👋🏾" },
  { value: "5", label: "濃い肌色", sample: "👋🏿" },
];

export default function EmojiTestPage() {
  const locale = useLocale() as Locale;
  const { data, isLoading, error } = useEmojiData(locale);
  const [tone, setTone] = useState(0);
  const categories = data?.categories ?? [];
  const totalCount = categories.reduce(
    (count, category) => count + category.emojis.length,
    0,
  );
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : String(error)
    : null;

  return (
    <PageContainer
      maxWidth="6xl"
      header={<PageHeader>Twemoji テスト</PageHeader>}
    >
      <div className="mb-6 flex items-center justify-between gap-4 pt-2">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "読み込み中..." : `${totalCount} 個の絵文字`}
        </p>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            肌の色
          </span>
          <Select
            value={String(tone)}
            onValueChange={(value) => setTone(Number(value))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKIN_TONE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <Twemoji emoji={option.sample} />
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          データの取得に失敗しました: {errorMessage}
        </div>
      )}

      {isLoading && !errorMessage && (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 6 }).map((_, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="mb-3 h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 24 }).map((_, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="size-9 animate-pulse rounded bg-muted"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && (
        <div className="flex flex-col gap-8 pb-8">
          {categories.map((category) => (
            <section key={category.id}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {category.label}
              </h2>
              <div className="flex flex-wrap gap-0.5">
                {category.emojis.map((item) => {
                  const emoji = resolveEmoji(item, tone);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      title={item.label}
                      aria-label={item.label}
                      className="flex size-9 items-center justify-center rounded text-xl transition-colors hover:bg-muted"
                    >
                      <Twemoji emoji={emoji} />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
