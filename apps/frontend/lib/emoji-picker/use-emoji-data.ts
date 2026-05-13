"use client";

import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Smile } from "lucide-react";

import {
  defaultLocale,
  locales,
  type Locale,
} from "@/i18n/constants";
import { CATEGORY_META } from "./constants";
import {
  buildEmojiSearchText,
  getEmojiSrc,
  isSingleTwemojiEmoji,
} from "./helpers";
import type { EmojiCategory, EmojiItem } from "./types";

export type EmojibaseLocale = Locale;

export interface EmojibaseSkin {
  tone: number | number[];
  emoji: string;
}

export interface EmojibaseEntry {
  emoji: string;
  label: string;
  group?: number;
  subgroup?: number;
  tags?: string[];
  skins?: EmojibaseSkin[];
}

export interface EmojibaseMessage {
  key: string;
  message: string;
  order: number;
}

export interface EmojibaseMessages {
  groups: EmojibaseMessage[];
  skinTones: Array<Pick<EmojibaseMessage, "key" | "message">>;
  subgroups?: EmojibaseMessage[];
}

export interface EmojibaseDataBundle {
  locale: EmojibaseLocale;
  emojis: EmojibaseEntry[];
  messages: EmojibaseMessages;
}

export interface EmojiData extends EmojibaseDataBundle {
  categories: EmojiCategory[];
}

type JsonModule<T> = { default: T };
type EmojibaseDataLoader = () => Promise<{
  emojis: EmojibaseEntry[];
  messages: EmojibaseMessages;
}>;

const emojibaseDataLoaders: Record<EmojibaseLocale, EmojibaseDataLoader> = {
  en: async () => {
    const [emojis, messages] = await Promise.all([
      import("emojibase-data/en/data.json").then(
        (module) => (module as JsonModule<EmojibaseEntry[]>).default,
      ),
      import("emojibase-data/en/messages.json").then(
        (module) => (module as JsonModule<EmojibaseMessages>).default,
      ),
    ]);

    return { emojis, messages };
  },
  ja: async () => {
    const [emojis, messages] = await Promise.all([
      import("emojibase-data/ja/data.json").then(
        (module) => (module as JsonModule<EmojibaseEntry[]>).default,
      ),
      import("emojibase-data/ja/messages.json").then(
        (module) => (module as JsonModule<EmojibaseMessages>).default,
      ),
    ]);

    return { emojis, messages };
  },
};

export function normalizeEmojibaseLocale(
  locale: string | null | undefined,
): EmojibaseLocale {
  const normalized = locale?.toLowerCase().split("-")[0];

  if (locales.includes(normalized as Locale)) {
    return normalized as EmojibaseLocale;
  }

  return defaultLocale;
}

export async function loadEmojibaseData(
  locale: string | null | undefined,
): Promise<EmojibaseDataBundle> {
  const normalizedLocale = normalizeEmojibaseLocale(locale);
  const data = await emojibaseDataLoaders[normalizedLocale]();

  return {
    locale: normalizedLocale,
    ...data,
  };
}

export function resolveEmoji(item: EmojiItem, tone: number): string {
  const base = item.emoji ?? "";
  if (tone === 0 || !item.skins) return base;
  const skin = item.skins.find((s) =>
    Array.isArray(s.tone) ? s.tone[0] === tone : s.tone === tone,
  );
  if (!skin) return base;
  return isSingleTwemojiEmoji(skin.emoji) ? skin.emoji : base;
}

function isSelectableEmojibaseEntry(
  entry: EmojibaseEntry,
  componentGroupOrder: number | undefined,
): entry is EmojibaseEntry & { group: number } {
  if (entry.group === undefined) {
    return false;
  }

  if (
    componentGroupOrder !== undefined &&
    entry.group === componentGroupOrder
  ) {
    return false;
  }

  return isSingleTwemojiEmoji(entry.emoji);
}

function buildStandardEmojiItem(entry: EmojibaseEntry & { group: number }): EmojiItem {
  const searchParts = [entry.label, ...(entry.tags ?? [])];

  return {
    key: `standard:${entry.emoji}`,
    type: "standard",
    emoji: entry.emoji,
    label: entry.label,
    searchText: buildEmojiSearchText(searchParts.join(" ")),
    group: entry.group,
    skins: entry.skins,
    src: getEmojiSrc(entry.emoji, "png"),
  };
}

export function buildStandardEmojiCategories(
  bundle: EmojibaseDataBundle,
): EmojiCategory[] {
  const componentGroupOrder = bundle.messages.groups.find(
    (group) => group.key === "component",
  )?.order;
  const validEmojis = bundle.emojis.filter((entry) =>
    isSelectableEmojibaseEntry(entry, componentGroupOrder),
  );
  const emojisByGroup = new Map<number, Array<EmojibaseEntry & { group: number }>>();

  for (const emoji of validEmojis) {
    const group = emojisByGroup.get(emoji.group);
    if (group) {
      group.push(emoji);
    } else {
      emojisByGroup.set(emoji.group, [emoji]);
    }
  }

  return bundle.messages.groups
    .filter((group) => group.key !== "component")
    .sort((left, right) => left.order - right.order)
    .map((group) => {
      const emojis = emojisByGroup.get(group.order);
      if (!emojis || emojis.length === 0) return null;

      const meta = CATEGORY_META[group.order];
      const icon: LucideIcon = meta?.icon ?? Smile;
      const id = meta?.id ?? group.key;

      return {
        id,
        label: group.message,
        icon,
        emojis: emojis.map(buildStandardEmojiItem),
      } satisfies EmojiCategory;
    })
    .filter((category): category is EmojiCategory => category !== null);
}

export async function getEmojiData(
  locale: string | null | undefined,
): Promise<EmojiData> {
  const bundle = await loadEmojibaseData(locale);

  return {
    ...bundle,
    categories: buildStandardEmojiCategories(bundle),
  };
}

export function useEmojiData(locale: string | null | undefined) {
  const normalizedLocale = normalizeEmojibaseLocale(locale);

  return useQuery({
    queryKey: ["emojibase-data", normalizedLocale],
    queryFn: () => getEmojiData(normalizedLocale),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}
