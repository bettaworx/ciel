"use client";

import { useQuery } from "@tanstack/react-query";
import { EMOJIBASE_CDN, CATEGORY_META } from "./constants";
import { buildEmojiSearchText, getEmojiSrc } from "./helpers";
import type { EmojiItem, EmojiCategory } from "./types";
import type { LucideIcon } from "lucide-react";
import { Smile } from "lucide-react";

// ---------------------------------------------------------------------------
// Emojibase raw types
// ---------------------------------------------------------------------------

interface EmojibaseEntry {
  emoji: string;
  label: string;
  group: number;
  subgroup?: number;
  skins?: Array<{ tone: number | number[]; emoji: string }>;
}

interface EmojibaseGroupMessage {
  key: string;
  message: string;
  order: number;
}

interface EmojibaseMessages {
  groups: EmojibaseGroupMessage[];
  skinTones: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Skin tone resolution (same logic as app/test/emoji/page.tsx)
// ---------------------------------------------------------------------------

export function resolveEmoji(item: EmojiItem, tone: number): string {
  const base = item.emoji ?? "";
  if (tone === 0 || !item.skins) return base;
  const skin = item.skins.find((s) =>
    Array.isArray(s.tone) ? s.tone[0] === tone : s.tone === tone,
  );
  if (!skin) return base;
  return getEmojiSrc(skin.emoji) ? skin.emoji : base;
}

// ---------------------------------------------------------------------------
// Fetch & process emojibase data
// ---------------------------------------------------------------------------

async function fetchEmojiData(): Promise<{
  categories: EmojiCategory[];
}> {
  const [data, messages] = await Promise.all([
    fetch(`${EMOJIBASE_CDN}/en/data.json`).then(
      (r) => r.json() as Promise<EmojibaseEntry[]>,
    ),
    fetch(`${EMOJIBASE_CDN}/en/messages.json`).then(
      (r) => r.json() as Promise<EmojibaseMessages>,
    ),
  ]);

  // Exclude the "component" group (skin tone modifier characters etc.)
  const componentGroupOrder = messages.groups.find(
    (g) => g.key === "component",
  )?.order;

  // Only keep emojis that twemoji 16.x recognises as a single unit
  const valid = data.filter((e) => {
    if (!("group" in e)) return false;
    if (
      componentGroupOrder !== undefined &&
      e.group === componentGroupOrder
    )
      return false;
    return getEmojiSrc(e.emoji) !== null;
  });

  // Build sorted group list
  const sortedGroups = messages.groups
    .filter((g) => g.key !== "component")
    .sort((a, b) => a.order - b.order);

  const categories: EmojiCategory[] = sortedGroups
    .map((g) => {
      const emojis = valid.filter((e) => e.group === g.order);
      if (emojis.length === 0) return null;

      const meta = CATEGORY_META[g.order];
      const icon: LucideIcon = meta?.icon ?? Smile;
      const id = meta?.id ?? g.key;

      return {
        id,
        label: g.message,
        icon,
        emojis: emojis.map(
          (e): EmojiItem => ({
            key: `standard:${e.emoji}`,
            type: "standard" as const,
            emoji: e.emoji,
            label: e.label,
            searchText: buildEmojiSearchText(e.label),
            group: e.group,
            skins: e.skins,
            src: getEmojiSrc(e.emoji),
          }),
        ),
      } satisfies EmojiCategory;
    })
    .filter((c): c is EmojiCategory => c !== null);

  return { categories };
}

// ---------------------------------------------------------------------------
// React Query hook
// ---------------------------------------------------------------------------

export function useEmojiData() {
  return useQuery({
    queryKey: ["emojibase-data"],
    queryFn: fetchEmojiData,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
