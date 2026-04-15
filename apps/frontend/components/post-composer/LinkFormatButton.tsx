"use client";

import { useEffect, useState, type RefObject } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyFormatToTextarea } from "./applyFormat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LinkFormatButtonProps {
  icon: LucideIcon;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setContent: (value: string) => void;
  content: string;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
}

interface LinkMatch {
  prefixStart: number;
  prefixEnd: number;
  urlStart: number;
  urlEnd: number;
  suffixEnd: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the enclosing `[...](...)` link around the cursor/selection.
 */
export function findLinkDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): LinkMatch | null {
  // Selection wraps the full link syntax
  if (selectionStart !== selectionEnd) {
    const selected = content.slice(selectionStart, selectionEnd);
    const wrapMatch = /^\[.*\]\(.*\)$/.exec(selected);
    if (wrapMatch) {
      const bracketClose = selected.indexOf("](");
      return {
        prefixStart: selectionStart,
        prefixEnd: selectionStart + 1, // after [
        urlStart: selectionStart + bracketClose + 2, // after ](
        urlEnd: selectionEnd - 1, // before )
        suffixEnd: selectionEnd,
      };
    }
  }

  // Search backwards for `[` that opens a link containing the cursor
  // We look for the pattern [...](...) where cursor is inside [] or ()
  const before = content.slice(0, selectionStart);

  // Try to find if cursor is inside the display text part [...]
  for (let i = before.length - 1; i >= 0; i--) {
    if (content[i] === "[") {
      // Check if there's no unescaped ] between this [ and cursor
      const betweenToCursor = content.slice(i + 1, selectionStart);
      if (betweenToCursor.includes("]")) continue;

      // Find the closing ](...)
      const afterCursor = content.slice(selectionEnd);
      const closeMatch = /^[^\]]*\]\([^)]*\)/.exec(afterCursor);
      if (closeMatch) {
        const bracketClosePos = selectionEnd + afterCursor.indexOf("](");
        const parenClosePos = selectionEnd + closeMatch[0].length;
        return {
          prefixStart: i,
          prefixEnd: i + 1,
          urlStart: bracketClosePos + 2,
          urlEnd: parenClosePos - 1,
          suffixEnd: parenClosePos,
        };
      }
      break;
    }
  }

  // Try to find if cursor is inside the URL part (...)
  for (let i = before.length - 1; i >= 0; i--) {
    if (content[i] === "(" && i > 0 && content[i - 1] === "]") {
      // Find the matching [
      let bracketStart = -1;
      for (let j = i - 2; j >= 0; j--) {
        if (content[j] === "[") {
          bracketStart = j;
          break;
        }
        if (content[j] === "]") break;
      }
      if (bracketStart === -1) continue;

      // Check no ) between ( and cursor
      const betweenToCursor = content.slice(i + 1, selectionStart);
      if (betweenToCursor.includes(")")) continue;

      // Find closing )
      const afterCursor = content.slice(selectionEnd);
      const closeIdx = afterCursor.indexOf(")");
      if (closeIdx === -1) continue;

      return {
        prefixStart: bracketStart,
        prefixEnd: bracketStart + 1,
        urlStart: i + 1,
        urlEnd: selectionEnd + closeIdx,
        suffixEnd: selectionEnd + closeIdx + 1,
      };
    }
  }

  return null;
}

export function removeLinkDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  match: LinkMatch,
): { newValue: string; newStart: number; newEnd: number } {
  // Extract the display text
  const displayText = content.slice(match.prefixEnd, match.urlStart - 2); // between [ and ](

  // Replace the entire link with just the display text
  const newValue =
    content.slice(0, match.prefixStart) +
    displayText +
    content.slice(match.suffixEnd);

  // Adjust cursor positions
  const offset = match.prefixStart - match.prefixEnd + 1; // shift from removing [
  const newStart = Math.max(
    match.prefixStart,
    Math.min(selectionStart + offset, match.prefixStart + displayText.length),
  );
  const newEnd = Math.max(
    match.prefixStart,
    Math.min(selectionEnd + offset, match.prefixStart + displayText.length),
  );

  return { newValue, newStart, newEnd };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Toolbar button that inserts an MFM/Markdown link (`[display](url)`).
 *
 * - **No selection**: inserts `[](url)` and places cursor inside `[]`.
 * - **Selection**: wraps as `[](selectedText)` and places cursor inside `[]`.
 * - **Active** (cursor inside a link): removes the link decoration.
 */
export function LinkFormatButton({
  icon: Icon,
  textareaRef,
  setContent,
  content,
  ariaLabel,
  className,
  iconClassName,
}: LinkFormatButtonProps) {
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const update = () => {
      setSelectionRange({
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      });
    };

    textarea.addEventListener("select", update);
    textarea.addEventListener("keyup", update);
    textarea.addEventListener("mouseup", update);
    textarea.addEventListener("click", update);
    textarea.addEventListener("focus", update);
    textarea.addEventListener("input", update);

    return () => {
      textarea.removeEventListener("select", update);
      textarea.removeEventListener("keyup", update);
      textarea.removeEventListener("mouseup", update);
      textarea.removeEventListener("click", update);
      textarea.removeEventListener("focus", update);
      textarea.removeEventListener("input", update);
    };
  }, [textareaRef]);

  const linkMatch = findLinkDecoration(
    content,
    selectionRange.start,
    selectionRange.end,
  );
  const isActive = linkMatch !== null;

  const handleClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const apply = (newValue: string, newStart: number, newEnd: number) =>
      applyFormatToTextarea(textarea, newValue, newStart, newEnd, setContent, setSelectionRange);

    if (isActive && linkMatch) {
      const { newValue, newStart, newEnd } = removeLinkDecoration(
        value,
        selectionStart,
        selectionEnd,
        linkMatch,
      );
      apply(newValue, newStart, newEnd);
      return;
    }

    const hasSelection = selectionStart !== selectionEnd;

    if (hasSelection) {
      const selected = value.slice(selectionStart, selectionEnd);
      const isUrl = /^https?:\/\/\S+$/.test(selected.trim());

      if (isUrl) {
        const newValue =
          value.slice(0, selectionStart) +
          "[](" +
          selected +
          ")" +
          value.slice(selectionEnd);
        apply(newValue, selectionStart + 1, selectionStart + 1);
      } else {
        const newValue =
          value.slice(0, selectionStart) +
          "[" +
          selected +
          "]()" +
          value.slice(selectionEnd);
        apply(newValue, selectionStart + 1 + selected.length + 2, selectionStart + 1 + selected.length + 2);
      }
    } else {
      const newValue =
        value.slice(0, selectionStart) + "[](url)" + value.slice(selectionStart);
      apply(newValue, selectionStart + 1, selectionStart + 1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={cn(
        isActive && "text-c-1 hover:text-c-2 bg-c-2/10 hover:bg-c-2/15",
        className,
      )}
    >
      <Icon className={cn(iconClassName)} />
    </Button>
  );
}
