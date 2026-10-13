"use client";

import * as React from "react";
import { SearchIcon, XIcon, type LucideIcon } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

import { cn } from "@/lib/utils";
import { useEmojiPickerData } from "@/lib/emoji-picker/use-emoji-picker-data";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  useEmojiSkinTone,
  useSetEmojiSkinTone,
  useSetRecentEmojis,
  addRecentEmoji,
} from "@/atoms/emoji-picker";
import { SKIN_TONE_OPTIONS } from "@/lib/emoji-picker/constants";
import {
  buildSectionLayouts,
  findActiveCategoryId,
  getGridWidth,
  type EmojiPickerLayoutMetrics,
  type EmojiPickerSectionLayout,
} from "@/lib/emoji-picker/layout";
import type { EmojiItem, EmojiCategory, EmojiSelectEvent } from "@/lib/emoji-picker/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";

const MOBILE_CELL_SIZE = 36;
const DESKTOP_CELL_SIZE = 32;
const MOBILE_GAP = 4;
const DESKTOP_GAP = 2;
const MOBILE_GRID_PADDING_X = 12;
const DESKTOP_GRID_PADDING_X = 4;
const CATEGORY_HEADER_HEIGHT = 44;
const SECTION_SPACING = 4;
const GRID_CHUNK_ROWS = 3;
const ACTIVE_CATEGORY_HEADER_OFFSET = CATEGORY_HEADER_HEIGHT;

function useElementWidth<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setWidth((current) => {
        const next = element.clientWidth;
        return current === next ? current : next;
      });
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  return { ref, width };
}

function getLayoutMetrics(
  isDesktop: boolean,
  columns: number,
  containerWidth: number,
): EmojiPickerLayoutMetrics {
  const fallbackCellSize = isDesktop ? DESKTOP_CELL_SIZE : MOBILE_CELL_SIZE;
  const gap = isDesktop ? DESKTOP_GAP : MOBILE_GAP;
  const gridPaddingX = isDesktop ? DESKTOP_GRID_PADDING_X : MOBILE_GRID_PADDING_X;
  const availableWidth = Math.max(0, containerWidth - gridPaddingX * 2);
  const fittedCellSize =
    columns > 0 && availableWidth > 0 ? availableWidth / columns : fallbackCellSize;
  const cellSize = Math.max(24, fittedCellSize || fallbackCellSize);

  return {
    cellSize,
    rowGap: gap,
    columnGap: gap,
    gridPaddingX,
    headerHeight: CATEGORY_HEADER_HEIGHT,
    sectionSpacing: SECTION_SPACING,
  };
}

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
  setViewportWidth: React.Dispatch<React.SetStateAction<number>>;
  layoutMetrics: EmojiPickerLayoutMetrics;
  sectionLayouts: EmojiPickerSectionLayout[];
}

interface EmojiPickerSearchContextValue {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const EmojiPickerDataContext = React.createContext<EmojiPickerDataContextValue | null>(null);
const EmojiPickerSearchContext = React.createContext<EmojiPickerSearchContextValue | null>(null);

function useEmojiPickerContext() {
  const ctx = React.useContext(EmojiPickerDataContext);
  if (!ctx) {
    throw new Error("EmojiPicker.* must be used within <EmojiPicker>");
  }
  return ctx;
}

function useEmojiPickerSearchContext() {
  const ctx = React.useContext(EmojiPickerSearchContext);
  if (!ctx) {
    throw new Error("EmojiPicker.* must be used within <EmojiPicker>");
  }
  return ctx;
}

interface EmojiPickerProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
  onEmojiSelect?: (event: EmojiSelectEvent) => void;
}

function EmojiPicker({ children, className, columns = 9, onEmojiSelect }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const [activeCategory, setActiveCategory] = React.useState("");
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const { ref: pickerRef, width: pickerWidth } = useElementWidth<HTMLDivElement>();
  const setRecentEmojis = useSetRecentEmojis();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const { categories, isLoading, isEmpty, isSearching } = useEmojiPickerData(deferredSearchQuery);
  const layoutMetrics = React.useMemo(
    () => getLayoutMetrics(isDesktop, columns, viewportWidth || pickerWidth),
    [isDesktop, columns, pickerWidth, viewportWidth],
  );
  const sectionLayouts = React.useMemo(
    () => buildSectionLayouts(categories, columns, layoutMetrics),
    [categories, columns, layoutMetrics],
  );
  const sectionLayoutMap = React.useMemo(
    () => new Map(sectionLayouts.map((layout) => [layout.id, layout])),
    [sectionLayouts],
  );

  React.useEffect(() => {
    if (categories.length === 0) {
      setActiveCategory("");
      return;
    }

    if (!activeCategory || !categories.some((category) => category.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const scrollToCategory = React.useCallback(
    (id: string) => {
      const container = contentRef.current;
      const targetLayout = sectionLayoutMap.get(id);
      if (!container || !targetLayout) {
        return;
      }

      setActiveCategory(id);
      container.scrollTo({ top: targetLayout.offsetTop, behavior: "smooth" });
    },
    [sectionLayoutMap],
  );

  const onSelect = React.useCallback(
    (event: EmojiSelectEvent) => {
      const key = event.type === "custom" ? `:${event.shortcode}:` : event.emoji;
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
      setViewportWidth,
      layoutMetrics,
      sectionLayouts,
    }),
    [
      categories,
      isLoading,
      isEmpty,
      isSearching,
      activeCategory,
      setActiveCategory,
      scrollToCategory,
      onSelect,
      columns,
      layoutMetrics,
      sectionLayouts,
      setViewportWidth,
    ],
  );

  return (
    <EmojiPickerSearchContext.Provider value={searchValue}>
      <EmojiPickerDataContext.Provider value={value}>
        <div
          ref={pickerRef}
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

  const currentColor =
    SKIN_TONE_OPTIONS.find((o) => o.value === skinTone)?.color ?? SKIN_TONE_OPTIONS[0].color;

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
      <Popover open={skinToneOpen} onOpenChange={setSkinToneOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-accent sm:size-6"
            aria-label={t("changeSkinTone")}
          >
            <span
              className="size-4 rounded-full sm:size-3.5"
              style={{ backgroundColor: currentColor }}
            />
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
              <span
                className="size-5 rounded-full sm:size-4"
                style={{ backgroundColor: opt.color }}
              />
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

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
      className="flex h-full w-full items-center justify-center rounded-md p-1 transition-colors hover:bg-accent sm:rounded-sm sm:p-0"
      title={item.label}
      aria-label={item.label}
      onClick={handleClick}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={item.type === "custom" ? (item.shortcode ?? item.label) : item.label}
          className="size-7 object-contain sm:size-6"
          decoding="async"
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

function CategoryLabel({ category }: { category: EmojiCategory }) {
  const t = useTranslations("emojiPicker");
  if (category.labelKey) {
    return <>{t(category.labelKey as Parameters<typeof t>[0])}</>;
  }
  return <>{category.label}</>;
}

// The outer container scrolls, so a per-section react-window Grid never virtualized.
// Instead, split each section into small row chunks and mount those near the viewport.
function useNearViewport(rootRef: React.RefObject<HTMLElement | null>) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [near, setNear] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // Once mounted a chunk stays: remounting on every pass back over it costs more
    // than keeping its few dozen nodes around.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { root: rootRef.current, rootMargin: "160px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootRef]);

  return { ref, near };
}

const EmojiGridChunk = React.memo(function EmojiGridChunk({
  items,
  columns,
  isLast,
  onSelect,
  metrics,
  rootRef,
}: {
  items: EmojiItem[];
  columns: number;
  isLast: boolean;
  onSelect: (event: EmojiSelectEvent) => void;
  metrics: EmojiPickerLayoutMetrics;
  rootRef: React.RefObject<HTMLElement | null>;
}) {
  const { ref, near } = useNearViewport(rootRef);
  const rowCount = Math.ceil(items.length / columns);
  const { cellSize, columnGap, rowGap } = metrics;

  return (
    <div
      ref={ref}
      style={{
        height: rowCount * cellSize,
        width: getGridWidth(columns, metrics),
      }}
    >
      {near && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
            gridAutoRows: cellSize,
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.key}
              style={{
                boxSizing: "border-box",
                paddingRight: index % columns === columns - 1 ? 0 : columnGap,
                paddingBottom: isLast && Math.floor(index / columns) === rowCount - 1 ? 0 : rowGap,
              }}
            >
              <EmojiButton item={item} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function EmojiGrid({
  items,
  columns,
  onSelect,
  metrics,
  rootRef,
}: {
  items: EmojiItem[];
  columns: number;
  onSelect: (event: EmojiSelectEvent) => void;
  metrics: EmojiPickerLayoutMetrics;
  rootRef: React.RefObject<HTMLElement | null>;
}) {
  // Stable chunk arrays let the memoized chunks skip re-rendering when only the
  // active category changes (which happens while scrolling).
  const chunks = React.useMemo(() => {
    const chunkSize = columns * GRID_CHUNK_ROWS;
    const result: EmojiItem[][] = [];
    if (columns > 0) {
      for (let i = 0; i < items.length; i += chunkSize) {
        result.push(items.slice(i, i + chunkSize));
      }
    }
    return result;
  }, [items, columns]);

  if (chunks.length === 0) {
    return null;
  }

  return (
    <div className="px-3 sm:px-1" data-grid-item-count={items.length}>
      {chunks.map((chunk, index) => (
        <EmojiGridChunk
          key={chunk[0].key}
          items={chunk}
          columns={columns}
          isLast={index === chunks.length - 1}
          onSelect={onSelect}
          metrics={metrics}
          rootRef={rootRef}
        />
      ))}
    </div>
  );
}

interface EmojiPickerContentProps {
  className?: string;
}

function SearchResultsHeader() {
  const t = useTranslations("emojiPicker");

  return (
    <div className="bg-popover text-muted-foreground px-3 pb-3.5 pt-3.5 text-sm leading-none sm:px-1 sm:text-xs">
      {t("searchResults")}
    </div>
  );
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
    setViewportWidth,
    layoutMetrics,
    sectionLayouts,
    setActiveCategory,
  } = useEmojiPickerContext();
  const t = useTranslations("emojiPicker");

  const searchResults = React.useMemo(() => {
    if (!isSearching) {
      return null;
    }
    return categories.flatMap((category) => category.emojis);
  }, [categories, isSearching]);

  React.useEffect(() => {
    const container = contentRef.current;
    if (!container) {
      return;
    }

    const updateWidth = () => {
      setViewportWidth((current) => {
        const next = container.clientWidth;
        return current === next ? current : next;
      });
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);
    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, [contentRef, setViewportWidth]);

  React.useEffect(() => {
    if (isSearching) {
      return;
    }

    const container = contentRef.current;
    if (!container) {
      return;
    }

    let frame = 0;
    const syncActiveCategory = () => {
      frame = 0;
      const nextActive = findActiveCategoryId(
        sectionLayouts,
        container.scrollTop,
        container.clientHeight,
        ACTIVE_CATEGORY_HEADER_OFFSET,
      );

      if (nextActive) {
        setActiveCategory(nextActive);
      }
    };

    const requestSync = () => {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(syncActiveCategory);
    };

    requestSync();
    container.addEventListener("scroll", requestSync, { passive: true });

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      container.removeEventListener("scroll", requestSync);
    };
  }, [contentRef, isSearching, sectionLayouts, setActiveCategory]);

  return (
    <div
      ref={contentRef}
      className={cn("outline-hidden relative flex-1 overflow-y-auto", className)}
      data-slot="emoji-picker-viewport"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Spinner size="xs" />
        </div>
      )}

      {isEmpty && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          {t("noEmojiFound")}
        </div>
      )}

      {!isLoading && (
        <div className="pb-1">
          {isSearching && searchResults ? (
            <>
              <SearchResultsHeader />
              <EmojiGrid
                items={searchResults}
                columns={columns}
                onSelect={onSelect}
                metrics={layoutMetrics}
                rootRef={contentRef}
              />
            </>
          ) : (
            categories.map((category) => (
              <section key={category.id} data-category-id={category.id}>
                <div className="bg-popover text-muted-foreground sticky top-0 z-10 px-3 pb-3.5 pt-3.5 text-sm leading-none sm:px-1 sm:text-xs">
                  <CategoryLabel category={category} />
                </div>
                <EmojiGrid
                  items={category.emojis}
                  columns={columns}
                  onSelect={onSelect}
                  metrics={layoutMetrics}
                  rootRef={contentRef}
                />
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface EmojiPickerFooterProps {
  className?: string;
}

function EmojiPickerFooter({ className }: EmojiPickerFooterProps) {
  const { categories, isSearching, activeCategory, scrollToCategory } = useEmojiPickerContext();
  const footerRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRefs = React.useRef(new Map<string, HTMLButtonElement>());

  React.useEffect(() => {
    const container = footerRef.current;
    const activeButton = buttonRefs.current.get(activeCategory);
    if (!container || !activeButton) {
      return;
    }

    const buttonCenter = activeButton.offsetLeft + activeButton.offsetWidth / 2;
    const nextScrollLeft = Math.max(0, buttonCenter - container.clientWidth / 2);

    container.scrollTo({
      left: nextScrollLeft,
      behavior: "smooth",
    });
  }, [activeCategory]);

  if (categories.length === 0 || isSearching) {
    return null;
  }

  return (
    <div
      ref={footerRef}
      className={cn(
        "flex w-full items-center gap-3 overflow-x-auto border-t p-3 sm:justify-between sm:gap-0 sm:p-2",
        className,
      )}
      data-slot="emoji-picker-footer"
    >
      {categories.map((category) => {
        const Icon: LucideIcon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            ref={(node) => {
              if (node) {
                buttonRefs.current.set(category.id, node);
                return;
              }

              buttonRefs.current.delete(category.id);
            }}
            type="button"
            className={cn(
              "flex aspect-square size-10 shrink-0 items-center justify-center rounded-md transition-colors sm:size-7",
              isActive
                ? "bg-c-9 text-c-1"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-label={category.label}
            onClick={(event) => {
              event.currentTarget.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
              scrollToCategory(category.id);
            }}
          >
            <Icon className="size-5 sm:size-[18px]" />
          </button>
        );
      })}
    </div>
  );
}

export { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter };

export type { EmojiSelectEvent };
