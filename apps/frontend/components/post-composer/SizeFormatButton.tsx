"use client";

import { useEffect, useState, type RefObject } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SIZE_NAMES = ["x2", "x3", "x4"] as const;
export type SizeName = (typeof SIZE_NAMES)[number];

const SIZE_REGEX = /\$\[(x2|x3|x4) /g;

export const SIZE_LABELS: Record<SizeName, string> = {
  x2: "2x",
  x3: "3x",
  x4: "4x",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SizeFormatButtonProps {
  icon: LucideIcon;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setContent: (value: string) => void;
  content: string;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
}

interface SizeMatch {
  sizeName: SizeName;
  prefixStart: number;
  prefixEnd: number;
  suffixStart: number;
  suffixEnd: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the enclosing `$[x{n} ... ]` block around the cursor/selection.
 */
export function findSizeDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): SizeMatch | null {
  // Check if selection wraps the decoration
  if (selectionStart !== selectionEnd) {
    const selected = content.slice(selectionStart, selectionEnd);
    const wrapMatch = /^\$\[(x2|x3|x4) /.exec(selected);
    if (wrapMatch && selected.endsWith("]")) {
      return {
        sizeName: wrapMatch[1] as SizeName,
        prefixStart: selectionStart,
        prefixEnd: selectionStart + wrapMatch[0].length,
        suffixStart: selectionEnd - 1,
        suffixEnd: selectionEnd,
      };
    }
  }

  // Search backwards for the last $[x{n}  before cursor
  const before = content.slice(0, selectionStart);
  SIZE_REGEX.lastIndex = 0;

  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = SIZE_REGEX.exec(before)) !== null) {
    lastMatch = m;
  }

  if (!lastMatch) return null;

  const prefixStart = lastMatch.index;
  const prefixEnd = prefixStart + lastMatch[0].length;
  const sizeName = lastMatch[1] as SizeName;

  // Verify the block is still open by counting brackets
  const between = content.slice(prefixEnd, selectionStart);
  let depth = 1;
  for (const ch of between) {
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (depth === 0) return null;
  }

  // Find the matching `]` after selectionEnd
  const after = content.slice(selectionEnd);
  let afterDepth = depth;
  for (let i = 0; i < after.length; i++) {
    if (after[i] === "[") afterDepth++;
    if (after[i] === "]") afterDepth--;
    if (afterDepth === 0) {
      return {
        sizeName,
        prefixStart,
        prefixEnd,
        suffixStart: selectionEnd + i,
        suffixEnd: selectionEnd + i + 1,
      };
    }
  }

  return null;
}

export function removeSizeDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  match: SizeMatch,
): { newValue: string; newStart: number; newEnd: number } {
  const prefixLen = match.prefixEnd - match.prefixStart;

  let newValue =
    content.slice(0, match.suffixStart) + content.slice(match.suffixEnd);
  newValue =
    newValue.slice(0, match.prefixStart) +
    newValue.slice(match.prefixStart + prefixLen);

  return {
    newValue,
    newStart: selectionStart - prefixLen,
    newEnd: selectionEnd - prefixLen,
  };
}

export function insertSizeDecoration(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  sizeName: SizeName,
): { newValue: string; newStart: number; newEnd: number } {
  const prefix = `$[${sizeName} `;
  const suffix = "]";
  const hasSelection = selectionStart !== selectionEnd;

  if (hasSelection) {
    const selected = value.slice(selectionStart, selectionEnd);
    const newValue =
      value.slice(0, selectionStart) +
      prefix +
      selected +
      suffix +
      value.slice(selectionEnd);
    return {
      newValue,
      newStart: selectionStart + prefix.length,
      newEnd: selectionEnd + prefix.length,
    };
  }

  const newValue =
    value.slice(0, selectionStart) +
    prefix +
    suffix +
    value.slice(selectionStart);
  const cursor = selectionStart + prefix.length;
  return { newValue, newStart: cursor, newEnd: cursor };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Toolbar button that applies an MFM size decoration (`$[x2 ...]`, etc.).
 *
 * - **Inactive**: opens a dropdown to choose 2x / 3x / 4x.
 * - **Active** (cursor inside a size decoration): removes the decoration.
 */
export function SizeFormatButton({
  icon: Icon,
  textareaRef,
  setContent,
  content,
  ariaLabel,
  className,
  iconClassName,
}: SizeFormatButtonProps) {
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

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

  const sizeMatch = findSizeDecoration(
    content,
    selectionRange.start,
    selectionRange.end,
  );
  const isActive = sizeMatch !== null;

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

  const handleRemove = () => {
    const textarea = textareaRef.current;
    if (!textarea || !sizeMatch) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const { newValue, newStart, newEnd } = removeSizeDecoration(
      value,
      selectionStart,
      selectionEnd,
      sizeMatch,
    );
    applyToTextarea(newValue, newStart, newEnd);
  };

  const handleSelectSize = (sizeName: SizeName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const { newValue, newStart, newEnd } = insertSizeDecoration(
      value,
      selectionStart,
      selectionEnd,
      sizeName,
    );
    applyToTextarea(newValue, newStart, newEnd);
    setMenuOpen(false);
  };

  if (isActive) {
    return (
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={handleRemove}
        aria-label={ariaLabel}
        aria-pressed
        className={cn(
          "text-c-1 hover:text-c-2 bg-c-2/10 hover:bg-c-2/15",
          className,
        )}
      >
        <Icon className={cn(iconClassName)} />
      </Button>
    );
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={ariaLabel}
          className={cn(className)}
        >
          <Icon className={cn(iconClassName)} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="z-[70]">
        {SIZE_NAMES.map((name) => (
          <DropdownMenuItem
            key={name}
            onSelect={() => handleSelectSize(name)}
          >
            {SIZE_LABELS[name]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
