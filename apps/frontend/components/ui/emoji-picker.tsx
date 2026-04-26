"use client";

import * as React from "react";
import { SearchIcon, LoaderIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";
import { Twemoji } from "@/components/Twemoji";
import { useEmojiPickerData } from "@/lib/emoji-picker/use-emoji-picker-data";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
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

interface EmojiPickerDataContextValue {
  categories: EmojiCategory[];
  isLoading: boolean;
  isEmpty: boolean;
  isSearching: boolean;
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  scrollToCategory: (id: string) => void;
  onSelect: (event: EmojiSelectEvent) => void;
  columns: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
  virtualizationDisabled: boolean;
  pendingCategoryRef: React.MutableRefObject<string | null>;
}

interface EmojiPickerSearchContextValue {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const EmojiPickerDataContext =
  React.createContext<EmojiPickerDataContextValue | null>(
    null,
  );
const EmojiPickerSearchContext =
  React.createContext<EmojiPickerSearchContextValue | null>(null);

function useEmojiPickerContext() {
  const ctx = React.useContext(EmojiPickerDataContext);
  if (!ctx)
    throw new Error("EmojiPicker.* must be used within <EmojiPicker>");
  return ctx;
}

function useEmojiPickerSearchContext() {
  const ctx = React.useContext(EmojiPickerSearchContext);
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
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const [activeCategory, setActiveCategory] = React.useState("");
  const [virtualizationDisabled, setVirtualizationDisabled] = React.useState(true);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const resumeVirtualizationTimerRef = React.useRef<number | null>(null);
  const pendingCategoryRef = React.useRef<string | null>(null);
  const setRecentEmojis = useSetRecentEmojis();

  const { categories, isLoading, isEmpty, isSearching } =
    useEmojiPickerData(deferredSearchQuery);

  React.useEffect(() => {
    setVirtualizationDisabled(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (resumeVirtualizationTimerRef.current !== null) {
        window.clearTimeout(resumeVirtualizationTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = React.useCallback((id: string) => {
    const container = contentRef.current;
    if (!container) return;

    if (resumeVirtualizationTimerRef.current !== null) {
      window.clearTimeout(resumeVirtualizationTimerRef.current);
    }

    flushSync(() => {
      setActiveCategory(id);
      pendingCategoryRef.current = id;
      setVirtualizationDisabled(true);
    });

    const scrollToTarget = () => {
      const target = container.querySelector(
        `[data-category-id="${id}"]`,
      ) as HTMLElement | null;
      if (!target) return false;

      container.scrollTo({ top: target.offsetTop, behavior: "smooth" });

      resumeVirtualizationTimerRef.current = window.setTimeout(() => {
        pendingCategoryRef.current = null;
        setActiveCategory(id);
        setVirtualizationDisabled(false);
        resumeVirtualizationTimerRef.current = null;
      }, 350);

      return true;
    };

    if (!scrollToTarget()) {
      window.requestAnimationFrame(() => {
        scrollToTarget();
      });
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

  const searchValue = React.useMemo(
    (): EmojiPickerSearchContextValue => ({
      searchQuery,
      setSearchQuery,
    }),
    [searchQuery],
  );

  const value = React.useMemo(
    (): EmojiPickerDataContextValue => ({
      categories,
      isLoading,
      isEmpty,
      isSearching,
      activeCategory,
      setActiveCategory,
      scrollToCategory,
      onSelect,
      columns,
      contentRef,
      virtualizationDisabled,
      pendingCategoryRef,
    }),
    [
      categories,
      isLoading,
      isEmpty,
      isSearching,
      activeCategory,
      scrollToCategory,
      onSelect,
      columns,
      virtualizationDisabled,
      pendingCategoryRef,
    ],
  );

  return (
    <EmojiPickerSearchContext.Provider value={searchValue}>
      <EmojiPickerDataContext.Provider value={value}>
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
      </EmojiPickerDataContext.Provider>
    </EmojiPickerSearchContext.Provider>
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
  const { searchQuery, setSearchQuery } = useEmojiPickerSearchContext();
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
        "flex h-12 items-center gap-2 border-b pl-4 pr-2 sm:h-9 sm:gap-1.5 sm:pl-3 sm:pr-1.5",
        className,
      )}
      data-slot="emoji-picker-search-wrapper"
    >
      <SearchIcon className="size-4.5 shrink-0 opacity-50 sm:size-4" />
      <input
        type="text"
        className="outline-hidden placeholder:text-muted-foreground flex h-12 w-full rounded-md bg-transparent py-3 text-base disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm"
        placeholder={placeholder ?? t("searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-slot="emoji-picker-search"
      />
      {/* Clear button — visible when input has text */}
      {searchQuery.length > 0 && (
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:size-6"
          aria-label={t("clearSearch")}
          onClick={() => setSearchQuery("")}
        >
          <XIcon className="size-4 sm:size-3.5" />
        </button>
      )}
      {/* Skin tone selector — always visible, controlled so it closes on selection */}
      <Popover open={skinToneOpen} onOpenChange={setSkinToneOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent sm:size-6"
            aria-label={t("changeSkinTone")}
          >
            <Twemoji emoji={currentSample} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="flex w-auto gap-1.5 p-2 sm:gap-1 sm:p-1.5"
          align="end"
          side="bottom"
          sideOffset={4}
        >
          {SKIN_TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                "flex size-10 items-center justify-center rounded-md transition-colors hover:bg-accent sm:size-8",
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
      className="flex aspect-square min-h-10 items-center justify-center rounded-md p-1 transition-colors hover:bg-accent sm:min-h-8 sm:rounded-sm sm:p-0"
      title={item.label}
      aria-label={item.label}
      onClick={handleClick}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={item.type === "custom" ? (item.shortcode ?? item.label) : item.label}
          className="size-7 object-contain sm:size-6"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span className="text-xl leading-none sm:text-base">
          {item.emoji ?? item.shortcode ?? "?"}
        </span>
      )}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Emoji grid (shared between category view and search view)
// ---------------------------------------------------------------------------

const MOBILE_ROW_GAP = 4;
const DESKTOP_ROW_GAP = 2;
const VIRTUAL_OVERSCAN_ROWS = 4;
const MOBILE_GRID_PADDING_X = 24;
const DESKTOP_GRID_PADDING_X = 8;

function useVirtualizedGridRange(
  itemCount: number,
  columns: number,
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  disabled: boolean,
) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const rowGap = isDesktop ? DESKTOP_ROW_GAP : MOBILE_ROW_GAP;
  const paddingX = isDesktop ? DESKTOP_GRID_PADDING_X : MOBILE_GRID_PADDING_X;
  const totalRows = Math.ceil(itemCount / columns);
  const [rowHeight, setRowHeight] = React.useState(0);
  const [range, setRange] = React.useState(() => ({
    startRow: 0,
    endRow: totalRows,
  }));

  React.useEffect(() => {
    setRange({ startRow: 0, endRow: totalRows });
  }, [totalRows, disabled]);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateMetrics = () => {
      const nextWidth = Math.max(0, wrapper.clientWidth - paddingX);
      const totalGap = Math.max(0, columns - 1) * rowGap;
      const nextRowHeight =
        columns > 0 ? Math.floor((nextWidth - totalGap) / columns) : 0;
      setRowHeight((current) =>
        current === nextRowHeight ? current : nextRowHeight,
      );
    };

    updateMetrics();

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(wrapper);
    window.addEventListener("resize", updateMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [columns, paddingX, rowGap, wrapperRef]);

  React.useEffect(() => {
    if (disabled || rowHeight <= 0) return;

    const container = scrollContainerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    let frame = 0;

    const updateRange = () => {
      frame = 0;

      const containerRect = container.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const gridTop = wrapperRect.top - containerRect.top + container.scrollTop;
      const viewportTop = container.scrollTop;
      const viewportBottom = viewportTop + container.clientHeight;
      const stride = rowHeight + rowGap;

      const startRow = Math.max(
        0,
        Math.floor((viewportTop - gridTop) / stride) - VIRTUAL_OVERSCAN_ROWS,
      );
      const endRow = Math.min(
        totalRows,
        Math.ceil((viewportBottom - gridTop) / stride) + VIRTUAL_OVERSCAN_ROWS,
      );

      setRange((current) => {
        if (
          current.startRow === startRow &&
          current.endRow === endRow
        ) {
          return current;
        }

        return {
          startRow,
          endRow: Math.max(startRow, endRow),
        };
      });
    };

    const requestUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateRange);
    };

    requestUpdate();
    container.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(container);
    resizeObserver.observe(wrapper);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      container.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      resizeObserver.disconnect();
    };
  }, [
    columns,
    disabled,
    rowGap,
    rowHeight,
    scrollContainerRef,
    totalRows,
    wrapperRef,
  ]);

  return {
    rowHeight,
    rowGap,
    totalRows,
    startRow: disabled ? 0 : range.startRow,
    endRow: disabled ? totalRows : range.endRow,
  };
}

function EmojiGrid({
  items,
  columns,
  onSelect,
}: {
  items: EmojiItem[];
  columns: number;
  onSelect: (event: EmojiSelectEvent) => void;
}) {
  const { contentRef, virtualizationDisabled } = useEmojiPickerContext();
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const {
    rowHeight,
    rowGap,
    totalRows,
    startRow,
    endRow,
  } = useVirtualizedGridRange(
    items.length,
    columns,
    wrapperRef,
    contentRef,
    virtualizationDisabled || items.length <= columns * 4,
  );

  const startIndex = startRow * columns;
  const endIndex = Math.min(items.length, endRow * columns);
  const visibleItems = items.slice(startIndex, endIndex);
  const visibleRows = Math.ceil(visibleItems.length / columns);
  const totalContentHeight =
    totalRows === 0 ? 0 : totalRows * rowHeight + (totalRows - 1) * rowGap;
  const topSpacerHeight = startRow * (rowHeight + rowGap);
  const visibleHeight =
    visibleRows === 0
      ? 0
      : visibleRows * rowHeight + (visibleRows - 1) * rowGap;
  const bottomSpacerHeight = Math.max(
    0,
    totalContentHeight - topSpacerHeight - visibleHeight,
  );

  return (
    <div
      ref={wrapperRef}
      className="px-3 sm:px-1"
    >
      {topSpacerHeight > 0 && (
        <div aria-hidden="true" style={{ height: topSpacerHeight }} />
      )}
      <div
        className="grid gap-1 sm:gap-0.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {visibleItems.map((item) => (
          <EmojiButton
            key={item.key}
            item={item}
            onSelect={onSelect}
          />
        ))}
      </div>
      {bottomSpacerHeight > 0 && (
        <div aria-hidden="true" style={{ height: bottomSpacerHeight }} />
      )}
      {items.length > 0 && visibleItems.length === 0 && (
        <div className="sr-only">{items.length}</div>
      )}
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
    pendingCategoryRef,
  } = useEmojiPickerContext();
  const t = useTranslations("emojiPicker");

  // Track active category from scroll position.
  // This is more stable than IntersectionObserver around category boundaries.
  React.useEffect(() => {
    if (isSearching) return;

    const container = contentRef.current;
    if (!container) return;

    let frame = 0;

    const updateActiveCategory = () => {
      frame = 0;

      const pendingCategory = pendingCategoryRef.current;
      if (pendingCategory) {
        const pendingSection = container.querySelector(
          `[data-category-id="${pendingCategory}"]`,
        ) as HTMLElement | null;
        if (pendingSection) {
          const distance = Math.abs(container.scrollTop - pendingSection.offsetTop);
          if (distance <= 16) {
            pendingCategoryRef.current = null;
            React.startTransition(() => setActiveCategory(pendingCategory));
          }
        }
        return;
      }

      const sections = Array.from(
        container.querySelectorAll("[data-category-id]"),
      ) as HTMLElement[];

      if (sections.length === 0) return;

      const anchor = container.scrollTop + 8;
      let nextActive = sections[0].dataset.categoryId ?? "";

      for (const section of sections) {
        if (section.offsetTop <= anchor) {
          nextActive = section.dataset.categoryId ?? nextActive;
          continue;
        }
        break;
      }

      if (nextActive) {
        React.startTransition(() => setActiveCategory(nextActive));
      }
    };

    const requestUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateActiveCategory);
    };

    requestUpdate();
    container.addEventListener("scroll", requestUpdate, { passive: true });

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      container.removeEventListener("scroll", requestUpdate);
    };
  }, [categories, isSearching, contentRef, setActiveCategory, pendingCategoryRef]);

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
              <div className="bg-popover text-muted-foreground px-3 pb-3.5 pt-3.5 text-sm leading-none sm:text-xs">
                {t("searchResults")}
              </div>
              <EmojiGrid items={searchResults} columns={columns} onSelect={onSelect} />
            </>
          ) : (
            categories.map((cat) => (
              <section key={cat.id} data-category-id={cat.id}>
                <div className="bg-popover text-muted-foreground sticky top-0 z-10 px-3 pb-3.5 pt-3.5 text-sm leading-none sm:text-xs">
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
        "flex w-full items-center sm:justify-between overflow-x-auto border-t p-3 sm:gap-0 gap-3 sm:p-2",
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
              "flex size-10 shrink-0 aspect-square items-center justify-center rounded-md transition-colors sm:size-7",
              isActive
                ? "bg-c-9 text-c-1"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
            aria-label={cat.label}
            tabIndex={isSearching ? -1 : undefined}
            onClick={(event) => {
              event.currentTarget.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
              scrollToCategory(cat.id);
            }}
          >
            <Icon className="size-5 sm:size-[18px]" />
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
