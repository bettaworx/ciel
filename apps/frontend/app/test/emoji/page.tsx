"use client";

import { useEffect, useState } from "react";
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

const EMOJIBASE_CDN = "https://cdn.jsdelivr.net/npm/emojibase-data@latest";

interface EmojiEntry {
  emoji: string;
  label: string;
  group: number;
  subgroup: number;
  skins?: Array<{ tone: number | number[]; emoji: string }>;
}

interface GroupMessage {
  key: string;
  message: string;
  order: number;
}

interface EmojibaseMessages {
  groups: GroupMessage[];
  skinTones: Record<string, string>;
}

const SKIN_TONE_OPTIONS = [
  { value: "0", label: "デフォルト", sample: "👋" },
  { value: "1", label: "薄い肌色", sample: "👋🏻" },
  { value: "2", label: "やや薄い肌色", sample: "👋🏼" },
  { value: "3", label: "中間の肌色", sample: "👋🏽" },
  { value: "4", label: "やや濃い肌色", sample: "👋🏾" },
  { value: "5", label: "濃い肌色", sample: "👋🏿" },
];

function resolveEmoji(entry: EmojiEntry, tone: number): string {
  if (tone === 0 || !entry.skins) return entry.emoji;
  const skin = entry.skins.find((s) =>
    Array.isArray(s.tone) ? s.tone[0] === tone : s.tone === tone,
  );
  return skin?.emoji ?? entry.emoji;
}

export default function EmojiTestPage() {
  const [emojis, setEmojis] = useState<EmojiEntry[]>([]);
  const [groups, setGroups] = useState<GroupMessage[]>([]);
  const [tone, setTone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${EMOJIBASE_CDN}/en/data.json`, { signal: controller.signal }).then(
        (r) => r.json() as Promise<EmojiEntry[]>,
      ),
      fetch(`${EMOJIBASE_CDN}/en/messages.json`, {
        signal: controller.signal,
      }).then((r) => r.json() as Promise<EmojibaseMessages>),
    ])
      .then(([data, messages]) => {
        setEmojis(data.filter((e) => "group" in e));
        setGroups(messages.groups.sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(String(err));
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const grouped = groups
    .map((g) => ({
      label: g.message,
      emojis: emojis.filter((e) => e.group === g.order),
    }))
    .filter((g) => g.emojis.length > 0);

  const totalCount = emojis.length;

  return (
    <PageContainer
      maxWidth="6xl"
      header={<PageHeader>Twemoji テスト</PageHeader>}
    >
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pt-2">
        <p className="text-sm text-muted-foreground">
          {loading ? "読み込み中…" : `${totalCount} 個の絵文字`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">肌の色</span>
          <Select
            value={String(tone)}
            onValueChange={(v) => setTone(Number(v))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKIN_TONE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <Twemoji emoji={opt.sample} />
                    <span>{opt.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm mb-6">
          データの取得に失敗しました: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="h-5 w-32 bg-muted rounded mb-3 animate-pulse" />
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 24 }).map((_, j) => (
                  <div key={j} className="w-9 h-9 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Emoji grid grouped by category */}
      {!loading && !error && (
        <div className="flex flex-col gap-8 pb-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </h2>
              <div className="flex flex-wrap gap-0.5">
                {group.emojis.map((entry) => {
                  const emojiStr = resolveEmoji(entry, tone);
                  return (
                    <button
                      key={entry.emoji}
                      title={entry.label}
                      aria-label={entry.label}
                      className="w-9 h-9 flex items-center justify-center rounded hover:bg-muted transition-colors text-xl"
                    >
                      <Twemoji emoji={emojiStr} />
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
