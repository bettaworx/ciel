"use client";

import { useState, type RefObject } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { applyFormatToTextarea } from "./applyFormat";
import type { TextSelectionRange, TextSelectionRangeSetter } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const FONT_NAMES = ["serif", "monospace", "cursive", "fantasy"] as const;
export type FontName = (typeof FONT_NAMES)[number];

const FONT_REGEX = /\$\[font\.(serif|monospace|cursive|fantasy) /g;

export const FONT_LABELS: Record<FontName, { label: string; style: string }> = {
  serif: { label: "Serif", style: "font-serif" },
  monospace: { label: "Monospace", style: "font-mono" },
  cursive: { label: "Cursive", style: "italic" },
  fantasy: { label: "Fantasy", style: "" },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FontFormatButtonProps {
  icon: LucideIcon;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setContent: (value: string) => void;
  content: string;
  selectionRange: TextSelectionRange;
  setSelectionRange: TextSelectionRangeSetter;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
}

interface FontMatch {
  fontName: FontName;
  prefixStart: number;
  prefixEnd: number;
  suffixStart: number;
  suffixEnd: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the enclosing `$[font.{name} ... ]` block around the cursor/selection.
 *
 * Uses bracket depth counting so nested `$[...]` blocks are handled correctly.
 */
export function findFontDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
): FontMatch | null {
  // Check if selection wraps the decoration
  if (selectionStart !== selectionEnd) {
    const selected = content.slice(selectionStart, selectionEnd);
    const wrapMatch = /^\$\[font\.(serif|monospace|cursive|fantasy) /.exec(
      selected,
    );
    if (wrapMatch && selected.endsWith("]")) {
      return {
        fontName: wrapMatch[1] as FontName,
        prefixStart: selectionStart,
        prefixEnd: selectionStart + wrapMatch[0].length,
        suffixStart: selectionEnd - 1,
        suffixEnd: selectionEnd,
      };
    }
  }

  // Search backwards for the last $[font.{name}  before cursor
  const before = content.slice(0, selectionStart);
  FONT_REGEX.lastIndex = 0;

  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = FONT_REGEX.exec(before)) !== null) {
    lastMatch = m;
  }

  if (!lastMatch) return null;

  const prefixStart = lastMatch.index;
  const prefixEnd = prefixStart + lastMatch[0].length;
  const fontName = lastMatch[1] as FontName;

  // Verify the block is still open by counting brackets between prefixEnd and selectionStart
  // The `$[` opened one bracket
  const between = content.slice(prefixEnd, selectionStart);
  let depth = 1;
  for (const ch of between) {
    if (ch === "[") depth++;
    if (ch === "]") depth--;
    if (depth === 0) return null; // block closed before cursor
  }

  // Find the matching `]` after selectionEnd
  const after = content.slice(selectionEnd);
  let afterDepth = depth;
  for (let i = 0; i < after.length; i++) {
    if (after[i] === "[") afterDepth++;
    if (after[i] === "]") afterDepth--;
    if (afterDepth === 0) {
      return {
        fontName,
        prefixStart,
        prefixEnd,
        suffixStart: selectionEnd + i,
        suffixEnd: selectionEnd + i + 1,
      };
    }
  }

  return null;
}

/**
 * Remove the font decoration, returning the new content and adjusted cursor.
 */
export function removeFontDecoration(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  match: FontMatch,
): { newValue: string; newStart: number; newEnd: number } {
  const prefixLen = match.prefixEnd - match.prefixStart;
  const suffixLen = match.suffixEnd - match.suffixStart;

  // Remove suffix first (higher index)
  let newValue =
    content.slice(0, match.suffixStart) + content.slice(match.suffixEnd);
  // Then remove prefix
  newValue =
    newValue.slice(0, match.prefixStart) +
    newValue.slice(match.prefixStart + prefixLen);

  return {
    newValue,
    newStart: selectionStart - prefixLen,
    newEnd: selectionEnd - prefixLen,
  };
}

/**
 * Insert a font decoration around the cursor/selection.
 */
export function insertFontDecoration(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  fontName: FontName,
): { newValue: string; newStart: number; newEnd: number } {
  const prefix = `$[font.${fontName} `;
  const suffix = "]";
  const hasSelection = selectionStart !== selectionEnd;

  if (hasSelection) {
    const selected = value.slice(selectionStart, selectionEnd);

    // If the selection is wrapped in an HTML-like tag (e.g. <center>...</center>),
    // $[...] must go *inside* the HTML tag, not outside.
    const htmlTagMatch = /^(<([a-zA-Z]\w*)>)([\s\S]*?)(<\/\2>)$/.exec(selected);
    if (htmlTagMatch) {
      const [, openTag, , innerContent, closeTag] = htmlTagMatch;
      const newValue =
        value.slice(0, selectionStart) +
        openTag +
        prefix +
        innerContent +
        suffix +
        closeTag +
        value.slice(selectionEnd);
      return {
        newValue,
        newStart: selectionStart + openTag.length + prefix.length,
        newEnd: selectionStart + openTag.length + prefix.length + innerContent.length,
      };
    }

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
 * Toolbar button that applies an MFM font decoration (`$[font.{name} ...]`).
 *
 * - **Inactive**: opens a dropdown to choose a font family.
 * - **Active** (cursor inside a font decoration): removes the decoration
 *   on click, without opening the dropdown.
 */
export function FontFormatButton({
  icon: Icon,
  textareaRef,
  setContent,
  content,
  selectionRange,
  setSelectionRange,
  ariaLabel,
  className,
  iconClassName,
}: FontFormatButtonProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [menuOpen, setMenuOpen] = useState(false);

  const fontMatch = findFontDecoration(
    content,
    selectionRange.start,
    selectionRange.end,
  );
  const isActive = fontMatch !== null;

  const handleRemove = () => {
    const textarea = textareaRef.current;
    if (!textarea || !fontMatch) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const { newValue, newStart, newEnd } = removeFontDecoration(
      value,
      selectionStart,
      selectionEnd,
      fontMatch,
    );
    applyFormatToTextarea(textarea, newValue, newStart, newEnd, setContent, setSelectionRange);
  };

  const handleSelectFont = (fontName: FontName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const { newValue, newStart, newEnd } = insertFontDecoration(
      value,
      selectionStart,
      selectionEnd,
      fontName,
    );
    applyFormatToTextarea(textarea, newValue, newStart, newEnd, setContent, setSelectionRange);
    setMenuOpen(false);
  };

  // When active, click directly removes decoration (no dropdown)
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

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label={ariaLabel}
      className={cn(className)}
    >
      <Icon className={cn(iconClassName)} />
    </Button>
  );

  const fontItems = FONT_NAMES.map((name) => ({ name, ...FONT_LABELS[name] }));

  // Desktop: DropdownMenu
  if (isDesktop) {
    return (
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom" className="z-[70]">
          {fontItems.map(({ name, label, style }) => (
            <DropdownMenuItem key={name} onSelect={() => handleSelectFont(name)}>
              <span className={style}>{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <div className="flex flex-col gap-1 p-2 pb-4">
          {fontItems.map(({ name, label, style }) => (
            <Button
              key={name}
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => handleSelectFont(name)}
            >
              <span className={style}>{label}</span>
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
