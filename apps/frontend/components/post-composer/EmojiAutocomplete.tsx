"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { CustomEmoji } from "@/components/CustomEmoji";
import { applyFormatToTextarea } from "@/components/post-composer/applyFormat";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useCustomEmojis } from "@/lib/hooks/use-queries";
import {
  applyEmojiSuggestion,
  getCustomEmojiSuggestions,
  getEmojiSuggestionMatch,
  type EmojiSuggestionMatch,
} from "@/lib/emoji-suggestions";
import { cn } from "@/lib/utils";

interface EmojiAutocompleteProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  disabled?: boolean;
}

interface CaretPosition {
  left: number;
  top: number;
  height: number;
}

export function EmojiAutocomplete({
  textareaRef,
  value,
  setValue,
  disabled = false,
}: EmojiAutocompleteProps) {
  const { data: emojis } = useCustomEmojis();
  const [match, setMatch] = useState<EmojiSuggestionMatch | null>(null);
  const [caretPosition, setCaretPosition] = useState<CaretPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    if (!match) {
      return [];
    }
    return getCustomEmojiSuggestions(emojis, match.query);
  }, [emojis, match]);

  const isOpen = !disabled && Boolean(match) && suggestions.length > 0 && Boolean(caretPosition);

  const syncFromTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) {
      setMatch(null);
      setCaretPosition(null);
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart !== selectionEnd) {
      setMatch(null);
      setCaretPosition(null);
      return;
    }

    const nextMatch = getEmojiSuggestionMatch(value, selectionStart);
    if (!nextMatch) {
      setMatch(null);
      setCaretPosition(null);
      return;
    }

    setMatch(nextMatch);
    setCaretPosition(getTextareaCaretPosition(textarea, selectionStart));
  }, [disabled, textareaRef, value]);

  const handleSelect = useCallback(
    (shortcode: string) => {
      const textarea = textareaRef.current;
      if (!textarea || !match) {
        return;
      }

      const { nextValue, caret } = applyEmojiSuggestion(value, match, shortcode);
      applyFormatToTextarea(
        textarea,
        nextValue,
        caret,
        caret,
        setValue,
        () => {},
      );
      setMatch(null);
      setCaretPosition(null);
      setActiveIndex(0);
    },
    [match, setValue, textareaRef, value],
  );

  useEffect(() => {
    syncFromTextarea();
  }, [syncFromTextarea]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((current) => Math.min(current, suggestions.length - 1));
  }, [isOpen, suggestions.length]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const sync = () => {
      syncFromTextarea();
    };

    textarea.addEventListener("input", sync);
    textarea.addEventListener("click", sync);
    textarea.addEventListener("keyup", sync);
    textarea.addEventListener("select", sync);
    textarea.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    return () => {
      textarea.removeEventListener("input", sync);
      textarea.removeEventListener("click", sync);
      textarea.removeEventListener("keyup", sync);
      textarea.removeEventListener("select", sync);
      textarea.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [syncFromTextarea, textareaRef]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % suggestions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
        return;
      }

      if (event.key === "Escape") {
        setMatch(null);
        setCaretPosition(null);
        setActiveIndex(0);
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        handleSelect(suggestions[activeIndex].shortcode);
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, handleSelect, isOpen, suggestions, textareaRef]);

  if (!isOpen || !caretPosition) {
    return null;
  }

  return (
    <Popover open={isOpen} modal={false}>
      <PopoverAnchor asChild>
        <div
          className="pointer-events-none absolute z-20 h-px w-px"
          aria-hidden="true"
          style={{
            left: `${caretPosition.left}px`,
            top: `${caretPosition.top + caretPosition.height}px`,
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-auto min-w-52 max-w-72 overflow-hidden rounded-xl p-0"
      >
        <ul className="py-1">
          {suggestions.map((emoji, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={emoji.shortcode}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/70",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelect(emoji.shortcode);
                  }}
                >
                  <CustomEmoji shortcode={`:${emoji.shortcode}:`} />
                  <span className="min-w-0 truncate font-medium">:{emoji.shortcode}:</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function getTextareaCaretPosition(
  textarea: HTMLTextAreaElement,
  caret: number,
): CaretPosition {
  const mirror = document.createElement("div");
  const style = window.getComputedStyle(textarea);
  const properties = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontFamily",
    "lineHeight",
    "letterSpacing",
    "textTransform",
    "textIndent",
    "textAlign",
    "whiteSpace",
    "wordBreak",
  ] as const;

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordBreak = "break-word";
  mirror.style.overflow = "hidden";

  for (const property of properties) {
    mirror.style[property] = style[property];
  }

  mirror.textContent = textarea.value.slice(0, caret);
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const left = marker.offsetLeft - textarea.scrollLeft + textarea.offsetLeft;
  const top = marker.offsetTop - textarea.scrollTop + textarea.offsetTop;
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) || 16;

  document.body.removeChild(mirror);

  return { left, top, height: lineHeight };
}
