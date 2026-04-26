"use client";

import * as React from "react";
import { SearchIcon, LoaderIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Twemoji } from "@/components/Twemoji";
import { useEmojiPickerData } from "@/lib/emoji-picker/use-emoji-picker-data";
import {
  useEmojiSkinTone,
  useSetEmojiSkinTone,
  useSetRecentEmojis,
  addRecentEmoji,
} from "@/atoms/emoji-picker";
import { SKIN_TONE_OPTIONS } from "@/lib/emoji-picker/constants";
import type {
  EmojiItem,
  EmojiCategory,
  EmojiSelectEvent,
} from "@/lib/emoji-picker/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface EmojiPickerContextValue {
  categories: EmojiCategory[];
  isLoading: boolean;
  isEmpty: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching: boolean;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  scrollToCategory: (id: string) => void;
  onSelect: (event: EmojiSelectEvent) => void;
  columns: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const EmojiPickerContext = React.createContext<EmojiPickerContextValue | null>(
  null,
);

function useEmojiPickerContext() {
  const ctx = React.useContext(EmojiPickerContext);
  if (!ctx)
    throw new Error("EmojiPicker.* must be used within <EmojiPicker>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

interface EmojiPickerProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
  onEmojiSelect?: (event: EmojiSelectEvent) => void;
}

function EmojiPicker({
  children,
  className,
  columns = 9,
  onEmojiSelect,
}: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("");
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const setRecentEmojis = useSetRecentEmojis();

  const { categories, isLoading, isEmpty } = useEmojiPickerData(searchQuery);

  const isSearching = searchQuery.trim().length > 0;

  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = React.useCallback((id: string) => {
    const el = contentRef.current?.querySelector(
      `[data-category-id="${id}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const onSelect = React.useCallback(
    (event: EmojiSelectEvent) => {
      const key =
        event.type === "custom" ? `:${event.shortcode}:` : event.emoji;
      setRecentEmojis((prev) => addRecentEmoji(prev, key));
      onEmojiSelect?.(event);
    },
    [onEmojiSelect, setRecentEmojis],
  );

  const value = React.useMemo(
    (): EmojiPickerContextValue => ({
      categories,
      isLoading,
      isEmpty,
      searchQuery,
      setSearchQuery,
      isSearching,
      activeCategory,
      setActiveCategory,
      scrollToCategory,
      onSelect,
      columns,
      contentRef,
    }),
    [
      categories,
      isLoading,
      isEmpty,
      searchQuery,
      isSearching,
      activeCategory,
      scrollToCategory,
      onSelect,
      columns,
    ],
  );

  return (
    <EmojiPickerContext.Provider value={value}>
      {/*
       * No overflow-hidden here — the parent container (e.g. PopoverContent
       * with overflow-hidden) is responsible for clipping to its border-radius.
       */}
      <div
        className={cn(
          "bg-popover text-popover-foreground isolate flex h-full w-full flex-col",
          className,
        )}
        data-slot="emoji-picker"
      >
        {children}
      </div>
    </EmojiPickerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Search bar + Skin tone selector
// ---------------------------------------------------------------------------

interface EmojiPickerSearchProps {
  className?: string;
  placeholder?: string;
}

function EmojiPickerSearch({ className, placeholder }: EmojiPickerSearchProps) {
  const { searchQuery, setSearchQuery } = useEmojiPickerContext();
  const skinTone = useEmojiSkinTone();
  const setSkinTone = useSetEmojiSkinTone();
  const t = useTranslations("emojiPicker");
  const [skinToneOpen, setSkinToneOpen] = React.useState(false);

  const currentSample =
    SKIN_TONE_OPTIONS.find((o) => o.value === skinTone)?.sample ??
    SKIN_TONE_OPTIONS[0].sample;

  return (
    <div
      className={cn(
        "flex h-9 items-center gap-1.5 border-b pl-3 pr-1.5",
        className,
      )}
      data-slot="emoji-picker-search-wrapper"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <input
        type="text"
        className="outline-hidden placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={placeholder ?? t("searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-slot="emoji-picker-search"
      />
      {/* Clear button — visible when input has text */}
      {searchQuery.length > 0 && (
        <button
          type="button"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label={t("clearSearch")}
          onClick={() => setSearchQuery("")}
        >
          <XIcon className="size-3.5" />
        </button>
      )}
      {/* Skin tone selector — always visible, controlled so it closes on selection */}
      <Popover open={skinToneOpen} onOpenChange={setSkinToneOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex size-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent"
            aria-label={t("changeSkinTone")}
          >
            <Twemoji emoji={currentSample} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-1.5 flex gap-1"
          align="end"
          side="bottom"
          sideOffset={4}
        >
          {SKIN_TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition-colors hover:bg-accent",
                skinTone === opt.value ? "bg-c-9" : undefined,
              )}
              aria-label={t(`skinTone.${opt.labelKey}`)}
              onClick={() => {
                setSkinTone(opt.value);
                setSkinToneOpen(false);
              }}
            >
              <Twemoji emoji={opt.sample} />
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emoji button — renders pre-computed src directly, no per-image state.
// src is computed once in use-emoji-picker-data when skin tone or data changes.
// ---------------------------------------------------------------------------

const EmojiButton = React.memo(function EmojiButton({
  item,
  onSelect,
}: {
  item: EmojiItem;
  onSelect: (event: EmojiSelectEvent) => void;
}) {
  const handleClick = () => {
    if (item.type === "custom" && item.shortcode) {
      onSelect({
        emoji: `:${item.shortcode}:`,
        type: "custom",
        shortcode: item.shortcode,
      });
    } else if (item.emoji) {
      onSelect({ emoji: item.emoji, type: "standard" });
    }
  };

  return (
    <button
      type="button"
      className="flex aspect-square items-center justify-center rounded-sm hover:bg-accent transition-colors"
      title={item.label}
      aria-label={item.label}
      onClick={handleClick}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={item.type === "custom" ? (item.shortcode ?? item.label) : item.label}
          className="size-6 object-contain"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span className="text-base leading-none">
          {item.emoji ?? item.shortcode ?? "?"}
        </span>
      )}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Emoji grid (shared between category view and search view)
// ---------------------------------------------------------------------------

function EmojiGrid({
  items,
  columns,
  onSelect,
}: {
  items: EmojiItem[];
  columns: number;
  onSelect: (event: EmojiSelectEvent) => void;
}) {
  return (
    <div
      className="grid gap-0.5 p-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <EmojiButton
          key={
            item.type === "custom"
              ? `custom-${item.shortcode}`
              : item.emoji ?? item.label
          }
          item={item}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category header label (resolves i18n key or falls back to raw label)
// ---------------------------------------------------------------------------

function CategoryLabel({ category }: { category: EmojiCategory }) {
  const t = useTranslations("emojiPicker");
  if (category.labelKey) {
    return <>{t(category.labelKey as Parameters<typeof t>[0])}</>;
  }
  return <>{category.label}</>;
}

// ---------------------------------------------------------------------------
// Content (scrollable grid)
// ---------------------------------------------------------------------------

interface EmojiPickerContentProps {
  className?: string;
}

function EmojiPickerContent({ className }: EmojiPickerContentProps) {
  const {
    categories,
    isLoading,
    isEmpty,
    isSearching,
    columns,
    onSelect,
    contentRef,
    setActiveCategory,
  } = useEmojiPickerContext();
  const t = useTranslations("emojiPicker");

  // Track active category via IntersectionObserver (only when not searching).
  // Use startTransition so updates don't block scroll rendering.
  React.useEffect(() => {
    if (isSearching) return;

    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.categoryId;
            if (id) {
              React.startTransition(() => setActiveCategory(id));
            }
          }
        }
      },
      {
        root: container,
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      },
    );

    const headers = container.querySelectorAll("[data-category-id]");
    headers.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [categories, isSearching, contentRef, setActiveCategory]);

  const searchResults = React.useMemo(() => {
    if (!isSearching) return null;
    return categories.flatMap((cat) => cat.emojis);
  }, [isSearching, categories]);

  return (
    <div
      ref={contentRef}
      className={cn("outline-hidden relative flex-1 overflow-y-auto", className)}
      data-slot="emoji-picker-viewport"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <LoaderIcon className="size-4 animate-spin" />
        </div>
      )}

      {isEmpty && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          {t("noEmojiFound")}
        </div>
      )}

      {!isLoading && (
        <div className="pb-1">
          {isSearching && searchResults ? (
            <>
              <div className="bg-popover text-muted-foreground px-3 pb-3.5 pt-3.5 text-xs leading-none">
                {t("searchResults")}
              </div>
              <EmojiGrid items={searchResults} columns={columns} onSelect={onSelect} />
            </>
          ) : (
            categories.map((cat) => (
              <section key={cat.id} data-category-id={cat.id}>
                <div className="bg-popover text-muted-foreground sticky top-0 z-10 px-3 pb-3.5 pt-3.5 text-xs leading-none">
                  <CategoryLabel category={cat} />
                </div>
                <EmojiGrid items={cat.emojis} columns={columns} onSelect={onSelect} />
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer (category navigation)
// ---------------------------------------------------------------------------

interface EmojiPickerFooterProps {
  className?: string;
}

function EmojiPickerFooter({ className }: EmojiPickerFooterProps) {
  const { categories, isSearching, activeCategory, scrollToCategory } =
    useEmojiPickerContext();

  if (categories.length === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-1 border-t p-2",
        // Keep in DOM while searching to prevent panel height change
        isSearching && "invisible pointer-events-none",
        className,
      )}
      data-slot="emoji-picker-footer"
      aria-hidden={isSearching}
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              isActive
                ? "bg-c-9 text-c-1"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
            aria-label={cat.label}
            tabIndex={isSearching ? -1 : undefined}
            onClick={() => scrollToCategory(cat.id)}
          >
            <Icon className="size-[18px]" />
          </button>
        );
      })}
    </div>
  );
}

export {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
};

export type { EmojiSelectEvent };
