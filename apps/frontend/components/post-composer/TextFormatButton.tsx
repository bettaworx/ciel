"use client";

import type { RefObject } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyFormatToTextarea } from "./applyFormat";
import type { TextSelectionRange, TextSelectionRangeSetter } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TextFormatButtonProps {
  /** Lucide icon to display */
  icon: LucideIcon;
  /** Text inserted before the selection or cursor */
  prefix: string;
  /** Text inserted after the selection or cursor */
  suffix: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setContent: (value: string) => void;
  /** Current textarea value — used to derive the active state */
  content: string;
  selectionRange: TextSelectionRange;
  setSelectionRange: TextSelectionRangeSetter;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
  /**
   * Optional override for the *insertion* path (not removal).
   * When provided, it replaces the default `prefix + selected + suffix` logic.
   * Return `null` to fall back to the default behaviour.
   */
  onInsert?: (
    value: string,
    selectionStart: number,
    selectionEnd: number,
  ) => { newValue: string; newStart: number; newEnd: number } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Index of the last single `*` in `text` that is NOT part of `**`. */
function lastSingleStarIndex(text: string): number {
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] !== "*") continue;
    const prevStar = i > 0 && text[i - 1] === "*";
    const nextStar = i < text.length - 1 && text[i + 1] === "*";
    if (!prevStar && !nextStar) return i;
    if (prevStar) i--; // skip the first `*` of `**`
  }
  return -1;
}

/** Index of the first single `*` in `text` that is NOT part of `**`. */
function firstSingleStarIndex(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "*") continue;
    const prevStar = i > 0 && text[i - 1] === "*";
    const nextStar = i < text.length - 1 && text[i + 1] === "*";
    if (!prevStar && !nextStar) return i;
    if (nextStar) i++; // skip the second `*` of `**`
  }
  return -1;
}

/**
 * Returns true when the cursor / selection range is inside a decoration
 * delimited by `prefix` and `suffix`.
 *
 * Strategy: count the number of opening markers before `selectionStart`.
 * An odd count means the cursor is inside an unclosed decoration.
 * We also verify that a closing marker exists after `selectionEnd`.
 */
export function isInsideDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
): boolean {
  // Selection wraps the markers themselves (e.g. user selected "**text**")
  if (selectionStart !== selectionEnd) {
    const selected = content.slice(selectionStart, selectionEnd);
    if (
      selected.startsWith(prefix) &&
      selected.endsWith(suffix) &&
      selected.length >= prefix.length + suffix.length
    ) {
      return true;
    }
  }

  const before = content.slice(0, selectionStart);
  const after = content.slice(selectionEnd);

  if (prefix === "**") {
    const count = (before.match(/\*\*/g) ?? []).length;
    return count % 2 === 1 && after.includes("**");
  }

  if (prefix === "*") {
    // Count single `*` (not `**`) before cursor by neutralising `**` pairs
    const cleanBefore = before.replace(/\*\*/g, "\x00\x00");
    const count = (cleanBefore.match(/\*/g) ?? []).length;
    const cleanAfter = after.replace(/\*\*/g, "\x00\x00");
    return count % 2 === 1 && /\*/.test(cleanAfter);
  }

  const escPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (prefix === suffix) {
    // Symmetric markers — odd count before cursor means "inside"
    const count = (before.match(new RegExp(escPrefix, "g")) ?? []).length;
    return count % 2 === 1 && after.includes(suffix);
  }

  // Asymmetric markers (e.g. <i> / </i>)
  const escSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const openCount = (before.match(new RegExp(escPrefix, "g")) ?? []).length;
  const closeCount = (before.match(new RegExp(escSuffix, "g")) ?? []).length;
  return openCount > closeCount && after.includes(suffix);
}

/**
 * Removes the decoration markers that surround the current cursor/selection.
 * Assumes `isInsideDecoration` has already returned `true`.
 */
export function removeDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
): { newValue: string; newStart: number; newEnd: number } {
  // Selection wraps the markers — strip them from the selection edges
  if (selectionStart !== selectionEnd) {
    const selected = content.slice(selectionStart, selectionEnd);
    if (
      selected.startsWith(prefix) &&
      selected.endsWith(suffix) &&
      selected.length >= prefix.length + suffix.length
    ) {
      const inner = selected.slice(
        prefix.length,
        selected.length - suffix.length,
      );
      const newValue =
        content.slice(0, selectionStart) + inner + content.slice(selectionEnd);
      return {
        newValue,
        newStart: selectionStart,
        newEnd: selectionStart + inner.length,
      };
    }
  }

  const before = content.slice(0, selectionStart);
  const after = content.slice(selectionEnd);

  let openIdx: number;
  let closeRelIdx: number;

  if (prefix === "**") {
    openIdx = before.lastIndexOf("**");
    closeRelIdx = after.indexOf("**");
  } else if (prefix === "*") {
    openIdx = lastSingleStarIndex(before);
    closeRelIdx = firstSingleStarIndex(after);
  } else {
    openIdx = before.lastIndexOf(prefix);
    closeRelIdx = after.indexOf(suffix);
  }

  if (openIdx === -1 || closeRelIdx === -1) {
    return {
      newValue: content,
      newStart: selectionStart,
      newEnd: selectionEnd,
    };
  }

  const closeIdx = selectionEnd + closeRelIdx;

  // Remove closing suffix first (higher index → doesn't shift earlier positions)
  let newValue =
    content.slice(0, closeIdx) + content.slice(closeIdx + suffix.length);
  // Then remove opening prefix
  newValue =
    newValue.slice(0, openIdx) + newValue.slice(openIdx + prefix.length);

  return {
    newValue,
    newStart: selectionStart - prefix.length,
    newEnd: selectionEnd - prefix.length,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * A toolbar button that toggles a markdown-style text decoration.
 *
 * - **Inactive + no selection**: inserts `prefix + suffix` at the cursor and
 *   places the cursor between them, e.g. `**|**`.
 * - **Inactive + selection**: wraps the selected text with `prefix`/`suffix`.
 * - **Active** (cursor is inside the decoration): removes the surrounding
 *   markers, leaving the plain text in place.
 *
 * The button is visually highlighted while active.
 */
export function TextFormatButton({
  icon: Icon,
  prefix,
  suffix,
  textareaRef,
  setContent,
  content,
  selectionRange,
  setSelectionRange,
  ariaLabel,
  className,
  iconClassName,
  onInsert,
}: TextFormatButtonProps) {
  const isActive = isInsideDecoration(
    content,
    selectionRange.start,
    selectionRange.end,
    prefix,
    suffix,
  );

  const handleClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    if (isActive) {
      const { newValue, newStart, newEnd } = removeDecoration(
        value,
        selectionStart,
        selectionEnd,
        prefix,
        suffix,
      );
      applyFormatToTextarea(textarea, newValue, newStart, newEnd, setContent, setSelectionRange);
    } else {
      // Allow callers to fully override the insertion logic (e.g. for <center>).
      const override = onInsert?.(value, selectionStart, selectionEnd);
      if (override !== null && override !== undefined) {
        applyFormatToTextarea(textarea, override.newValue, override.newStart, override.newEnd, setContent, setSelectionRange);
        return;
      }

      const hasSelection = selectionStart !== selectionEnd;
      let newValue: string;
      let newStart: number;
      let newEnd: number;

      if (hasSelection) {
        const selected = value.slice(selectionStart, selectionEnd);

        // If the selection is wrapped in <center>...</center> and the current
        // decoration is NOT center itself, the decoration must go *inside*
        // <center> so that <center> remains the outermost HTML wrapper.
        if (prefix !== "<center>" && selected.startsWith("<center>") && selected.endsWith("</center>")) {
          const inner = selected.slice("<center>".length, selected.length - "</center>".length);
          newValue =
            value.slice(0, selectionStart) +
            "<center>" + prefix + inner + suffix + "</center>" +
            value.slice(selectionEnd);
          newStart = selectionStart + "<center>".length + prefix.length;
          newEnd = newStart + inner.length;
        } else {
          newValue =
            value.slice(0, selectionStart) +
            prefix +
            selected +
            suffix +
            value.slice(selectionEnd);
          newStart = selectionStart + prefix.length;
          newEnd = selectionEnd + prefix.length;
        }
      } else {
        newValue =
          value.slice(0, selectionStart) +
          prefix +
          suffix +
          value.slice(selectionStart);
        newStart = selectionStart + prefix.length;
        newEnd = newStart;
      }

      applyFormatToTextarea(textarea, newValue, newStart, newEnd, setContent, setSelectionRange);
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
