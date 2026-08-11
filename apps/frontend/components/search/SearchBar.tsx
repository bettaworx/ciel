"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { Clock, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchHistoryAtom } from "@/atoms/search-history";
import {
  filterSearchHistory,
  pushSearchHistory,
  removeSearchHistory,
} from "@/lib/search-history";
import { searchUrl, type SearchTab } from "@/lib/search-tabs";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  /** The query the page is currently showing, from the URL. */
  query: string;
  /** The tab to stay on when a new search is submitted. */
  tab: SearchTab;
};

/**
 * The search box: submits on Enter and offers past searches while focused.
 *
 * The URL owns the query, so this only holds what is being typed. Nothing is
 * searched until submit — the mini-syntax means a half-typed `from:` would
 * otherwise fire a run of meaningless requests.
 */
export function SearchBar({ query, tab }: SearchBarProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const [history, setHistory] = useAtom(searchHistoryAtom);

  const [input, setInput] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  // -1 means "nothing picked": Enter then submits whatever was typed.
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const optionIdPrefix = useId();

  // Follow the URL when it changes underneath us — back/forward, or a history
  // entry picked from the dropdown.
  useEffect(() => {
    setInput(query);
  }, [query]);

  const suggestions = useMemo(
    () => filterSearchHistory(history, input),
    [history, input],
  );
  const isOpen = isFocused && suggestions.length > 0;

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setHistory((current) => pushSearchHistory(current, trimmed));
    setActiveIndex(-1);
    setIsFocused(false);
    inputRef.current?.blur();
    router.push(searchUrl(trimmed, tab));
  };

  const removeEntry = (entry: string) => {
    setHistory((current) => removeSearchHistory(current, entry));
    // The rows below shift up, so a held highlight would land on a different
    // entry than the pointer is over.
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsFocused(false);
      setActiveIndex(-1);
      return;
    }
    if (!isOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const picked = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
    submit(picked ?? input);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            // Deliberately not type="search": that brings the browser's own
            // clear button, which cannot be styled and clears on Escape, where
            // Escape here means "close the suggestions".
            type="text"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsFocused(true)}
            // A pointerdown on an option preventDefaults, so this only fires
            // when focus genuinely leaves the box.
            onBlur={() => {
              setIsFocused(false);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            aria-label={t("title")}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${optionIdPrefix}-${activeIndex}` : undefined
            }
            className="h-12 rounded-2xl bg-card pl-10 pr-12 hover:bg-card-hover"
          />
          {input && (
            <button
              type="button"
              // Keeps focus in the box, so clearing leaves the suggestions up
              // and ready for the next query instead of closing them.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setInput("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
              aria-label={t("clear")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-muted-foreground hover:bg-card-hover hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("history.label")}
          // Sits over the results, clearing the 48px input.
          className="absolute inset-x-0 top-14 z-30 overflow-hidden rounded-2xl bg-popover p-1"
        >
          {suggestions.map((entry, index) => (
            <li
              key={entry}
              id={`${optionIdPrefix}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              // Without this the input blurs first, closing the list before the
              // click can land on it.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => submit(entry)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                // Fixed height, so the delete button appearing and disappearing
                // with the pointer cannot resize the row under it.
                "flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm",
                index === activeIndex ? "bg-card-hover" : "bg-transparent",
              )}
            >
              <Clock
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="truncate">{entry}</span>
              <button
                type="button"
                // Nothing inside the listbox is focusable: the input keeps
                // focus and drives the list through aria-activedescendant.
                tabIndex={-1}
                aria-label={t("history.remove", { query: entry })}
                onPointerDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  // Otherwise the row underneath runs the search we just removed.
                  event.stopPropagation();
                  removeEntry(entry);
                }}
                className={cn(
                  "ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-transparent text-muted-foreground hover:bg-popover hover:text-foreground",
                  // The row reveals it on hover, but touch has no hover, so
                  // below sm it simply stays put.
                  index === activeIndex ? "sm:flex" : "sm:hidden",
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
