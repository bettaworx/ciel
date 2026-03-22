"use client";

import { useEffect, useState, type RefObject } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CodeFormatButtonProps {
  icon: LucideIcon;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setContent: (value: string) => void;
  content: string;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
}

interface CodeMatch {
  type: "inline" | "block";
  prefixStart: number;
  prefixEnd: number;
  suffixStart: number;
  suffixEnd: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the enclosing code decoration around the cursor/selection.
 * Checks for code blocks (```) first, then inline code (`).
 */
export function findCodeDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): CodeMatch | null {
  // --- Selection wraps the decoration ---
  if (selectionStart !== selectionEnd) {
    const selected = content.slice(selectionStart, selectionEnd);
    // Code block: ```\n...\n```
    if (selected.startsWith("```") && selected.endsWith("```")) {
      // Find where the opening ``` line ends (skip optional lang identifier)
      const firstNewline = selected.indexOf("\n");
      if (firstNewline !== -1) {
        const lastNewline = selected.lastIndexOf("\n");
        if (lastNewline > firstNewline) {
          return {
            type: "block",
            prefixStart: selectionStart,
            prefixEnd: selectionStart + firstNewline + 1,
            suffixStart: selectionEnd - 3,
            suffixEnd: selectionEnd,
          };
        }
      }
    }
    // Inline code: `...`
    if (
      selected.startsWith("`") &&
      selected.endsWith("`") &&
      selected.length >= 2
    ) {
      return {
        type: "inline",
        prefixStart: selectionStart,
        prefixEnd: selectionStart + 1,
        suffixStart: selectionEnd - 1,
        suffixEnd: selectionEnd,
      };
    }
  }

  const before = content.slice(0, selectionStart);
  const after = content.slice(selectionEnd);

  // --- Code block detection (``` ... ```) ---
  // Count ``` before cursor; odd = inside a code block
  const blockCountBefore = (before.match(/```/g) ?? []).length;
  if (blockCountBefore % 2 === 1 && after.includes("```")) {
    // Find the last ``` in before (opening)
    const openIdx = before.lastIndexOf("```");
    // The prefix extends to the end of the opening line (```lang\n)
    const prefixNewline = content.indexOf("\n", openIdx);
    const prefixEnd =
      prefixNewline !== -1 ? prefixNewline + 1 : openIdx + 3;

    // Find the first ``` in after (closing)
    const closeRelIdx = after.indexOf("```");
    const suffixStart = selectionEnd + closeRelIdx;

    return {
      type: "block",
      prefixStart: openIdx,
      prefixEnd,
      suffixStart,
      suffixEnd: suffixStart + 3,
    };
  }

  // --- Inline code detection (` ... `) ---
  // Replace ``` with placeholders to isolate single backticks
  const cleanBefore = before.replace(/```/g, "\x00\x00\x00");
  const inlineCountBefore = (cleanBefore.match(/`/g) ?? []).length;
  const cleanAfter = after.replace(/```/g, "\x00\x00\x00");
  if (inlineCountBefore % 2 === 1 && /`/.test(cleanAfter)) {
    // Find the last single ` in before
    const openIdx = findLastSingleBacktick(before);
    // Find the first single ` in after
    const closeRelIdx = findFirstSingleBacktick(after);
    if (openIdx !== -1 && closeRelIdx !== -1) {
      return {
        type: "inline",
        prefixStart: openIdx,
        prefixEnd: openIdx + 1,
        suffixStart: selectionEnd + closeRelIdx,
        suffixEnd: selectionEnd + closeRelIdx + 1,
      };
    }
  }

  return null;
}

/** Find the last `` ` `` in text that is NOT part of `` ``` ``. */
function findLastSingleBacktick(text: string): number {
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] !== "`") continue;
    // Check if part of ```
    if (isPartOfTripleBacktick(text, i)) {
      // Skip past the triple
      while (i > 0 && text[i - 1] === "`") i--;
      continue;
    }
    return i;
  }
  return -1;
}

/** Find the first `` ` `` in text that is NOT part of `` ``` ``. */
function findFirstSingleBacktick(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "`") continue;
    if (isPartOfTripleBacktick(text, i)) {
      while (i + 1 < text.length && text[i + 1] === "`") i++;
      continue;
    }
    return i;
  }
  return -1;
}

/** Check if the backtick at position `i` is part of a ``` sequence. */
function isPartOfTripleBacktick(text: string, i: number): boolean {
  // Check all possible positions within a triple: [i-2..i], [i-1..i+1], [i..i+2]
  if (
    i >= 2 &&
    text[i - 1] === "`" &&
    text[i - 2] === "`"
  )
    return true;
  if (
    i >= 1 &&
    i < text.length - 1 &&
    text[i - 1] === "`" &&
    text[i + 1] === "`"
  )
    return true;
  if (
    i < text.length - 2 &&
    text[i + 1] === "`" &&
    text[i + 2] === "`"
  )
    return true;
  return false;
}

/**
 * Remove code decoration and return new content with adjusted cursor.
 */
export function removeCodeDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  match: CodeMatch,
): { newValue: string; newStart: number; newEnd: number } {
  const prefixLen = match.prefixEnd - match.prefixStart;

  // Remove suffix first (higher index)
  let newValue =
    content.slice(0, match.suffixStart) + content.slice(match.suffixEnd);
  // For code blocks, also remove the preceding newline if present
  if (
    match.type === "block" &&
    newValue[match.suffixStart - 1] === "\n"
  ) {
    newValue =
      newValue.slice(0, match.suffixStart - 1) +
      newValue.slice(match.suffixStart);
  }
  // Remove prefix
  newValue =
    newValue.slice(0, match.prefixStart) +
    newValue.slice(match.prefixStart + prefixLen);

  return {
    newValue,
    newStart: selectionStart - prefixLen,
    newEnd: selectionEnd - prefixLen,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Toolbar button for inline code (`` ` ``) and code blocks (`` ``` ``).
 *
 * Behaviour:
 * - **No selection**: inserts `` ` `` + `` ` `` and places cursor between.
 * - **Single-line selection**: wraps with `` ` ``.
 * - **Multi-line selection**: wraps with `` ``` ``.
 * - **Active**: removes the enclosing code decoration on click.
 */
export function CodeFormatButton({
  icon: Icon,
  textareaRef,
  setContent,
  content,
  ariaLabel,
  className,
  iconClassName,
}: CodeFormatButtonProps) {
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

  const codeMatch = findCodeDecoration(
    content,
    selectionRange.start,
    selectionRange.end,
  );
  const isActive = codeMatch !== null;

  const applyToTextarea = (
    newValue: string,
    newStart: number,
    newEnd: number,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setContent(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
      setSelectionRange({ start: newStart, end: newEnd });
    });
  };

  const handleClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    if (isActive && codeMatch) {
      // Remove decoration
      const { newValue, newStart, newEnd } = removeCodeDecoration(
        value,
        selectionStart,
        selectionEnd,
        codeMatch,
      );
      applyToTextarea(newValue, newStart, newEnd);
      return;
    }

    // Insert decoration
    const hasSelection = selectionStart !== selectionEnd;

    if (!hasSelection) {
      // No selection — insert `` and place cursor between
      const newValue =
        value.slice(0, selectionStart) + "``" + value.slice(selectionStart);
      const cursor = selectionStart + 1;
      applyToTextarea(newValue, cursor, cursor);
      return;
    }

    const selected = value.slice(selectionStart, selectionEnd);
    const isMultiLine = selected.includes("\n");

    if (isMultiLine) {
      // Multi-line — wrap with ```
      const prefix = "```\n";
      const suffix = "\n```";
      const newValue =
        value.slice(0, selectionStart) +
        prefix +
        selected +
        suffix +
        value.slice(selectionEnd);
      applyToTextarea(
        newValue,
        selectionStart + prefix.length,
        selectionEnd + prefix.length,
      );
    } else {
      // Single-line — wrap with `
      const newValue =
        value.slice(0, selectionStart) +
        "`" +
        selected +
        "`" +
        value.slice(selectionEnd);
      applyToTextarea(newValue, selectionStart + 1, selectionEnd + 1);
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
