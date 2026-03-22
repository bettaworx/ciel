"use client";

import { useEffect, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import {
  Ellipsis,
  Type,
  ALargeSmall,
  CodeXml,
  Link,
  AlignHorizontalSpaceAround,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  findFontDecoration,
  removeFontDecoration,
  insertFontDecoration,
  FONT_NAMES,
  FONT_LABELS,
  type FontName,
} from "./FontFormatButton";
import {
  findSizeDecoration,
  removeSizeDecoration,
  insertSizeDecoration,
  SIZE_NAMES,
  SIZE_LABELS,
  type SizeName,
} from "./SizeFormatButton";
import {
  findCodeDecoration,
  removeCodeDecoration,
} from "./CodeFormatButton";
import {
  findLinkDecoration,
  removeLinkDecoration,
} from "./LinkFormatButton";
import {
  isInsideDecoration,
  removeDecoration,
} from "./TextFormatButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormatOverflowMenuProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  setContent: (value: string) => void;
  content: string;
  className?: string;
  iconClassName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormatOverflowMenu({
  textareaRef,
  setContent,
  content,
  className,
  iconClassName,
}: FormatOverflowMenuProps) {
  const t = useTranslations();
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

  const { start, end } = selectionRange;

  // Active state detection
  const fontMatch = findFontDecoration(content, start, end);
  const sizeMatch = findSizeDecoration(content, start, end);
  const codeMatch = findCodeDecoration(content, start, end);
  const linkMatch = findLinkDecoration(content, start, end);
  const isCenterActive = isInsideDecoration(
    content,
    start,
    end,
    "<center>",
    "</center>",
  );

  const hasAnyActive =
    fontMatch !== null ||
    sizeMatch !== null ||
    codeMatch !== null ||
    linkMatch !== null ||
    isCenterActive;

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

  // --- Font handlers ---
  const handleFontSelect = (fontName: FontName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (fontMatch && fontMatch.fontName === fontName) {
      const { newValue, newStart, newEnd } = removeFontDecoration(
        value,
        selectionStart,
        selectionEnd,
        fontMatch,
      );
      applyToTextarea(newValue, newStart, newEnd);
    } else if (fontMatch) {
      const { newValue, newStart, newEnd } = removeFontDecoration(
        value,
        selectionStart,
        selectionEnd,
        fontMatch,
      );
      const result = insertFontDecoration(newValue, newStart, newEnd, fontName);
      applyToTextarea(result.newValue, result.newStart, result.newEnd);
    } else {
      const { newValue, newStart, newEnd } = insertFontDecoration(
        value,
        selectionStart,
        selectionEnd,
        fontName,
      );
      applyToTextarea(newValue, newStart, newEnd);
    }
    setMenuOpen(false);
  };

  // --- Size handlers ---
  const handleSizeSelect = (sizeName: SizeName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (sizeMatch && sizeMatch.sizeName === sizeName) {
      const { newValue, newStart, newEnd } = removeSizeDecoration(
        value,
        selectionStart,
        selectionEnd,
        sizeMatch,
      );
      applyToTextarea(newValue, newStart, newEnd);
    } else if (sizeMatch) {
      const { newValue, newStart, newEnd } = removeSizeDecoration(
        value,
        selectionStart,
        selectionEnd,
        sizeMatch,
      );
      const result = insertSizeDecoration(newValue, newStart, newEnd, sizeName);
      applyToTextarea(result.newValue, result.newStart, result.newEnd);
    } else {
      const { newValue, newStart, newEnd } = insertSizeDecoration(
        value,
        selectionStart,
        selectionEnd,
        sizeName,
      );
      applyToTextarea(newValue, newStart, newEnd);
    }
    setMenuOpen(false);
  };

  // --- Code handler ---
  const handleCodeToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (codeMatch) {
      const { newValue, newStart, newEnd } = removeCodeDecoration(
        value,
        selectionStart,
        selectionEnd,
        codeMatch,
      );
      applyToTextarea(newValue, newStart, newEnd);
    } else {
      const hasSelection = selectionStart !== selectionEnd;
      if (!hasSelection) {
        const newValue =
          value.slice(0, selectionStart) + "``" + value.slice(selectionStart);
        applyToTextarea(newValue, selectionStart + 1, selectionStart + 1);
      } else {
        const selected = value.slice(selectionStart, selectionEnd);
        const isMultiLine = selected.includes("\n");
        if (isMultiLine) {
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
          const newValue =
            value.slice(0, selectionStart) +
            "`" +
            selected +
            "`" +
            value.slice(selectionEnd);
          applyToTextarea(newValue, selectionStart + 1, selectionEnd + 1);
        }
      }
    }
    setMenuOpen(false);
  };

  // --- Link handler ---
  const handleLinkToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (linkMatch) {
      const { newValue, newStart, newEnd } = removeLinkDecoration(
        value,
        selectionStart,
        selectionEnd,
        linkMatch,
      );
      applyToTextarea(newValue, newStart, newEnd);
    } else {
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
          const cursor = selectionStart + 1;
          applyToTextarea(newValue, cursor, cursor);
        } else {
          const newValue =
            value.slice(0, selectionStart) +
            "[" +
            selected +
            "]()" +
            value.slice(selectionEnd);
          const cursor = selectionStart + 1 + selected.length + 2;
          applyToTextarea(newValue, cursor, cursor);
        }
      } else {
        const newValue =
          value.slice(0, selectionStart) +
          "[](url)" +
          value.slice(selectionStart);
        applyToTextarea(newValue, selectionStart + 1, selectionStart + 1);
      }
    }
    setMenuOpen(false);
  };

  // --- Center handler ---
  const handleCenterToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (isCenterActive) {
      const { newValue, newStart, newEnd } = removeDecoration(
        value,
        selectionStart,
        selectionEnd,
        "<center>",
        "</center>",
      );
      applyToTextarea(newValue, newStart, newEnd);
    } else {
      const hasSelection = selectionStart !== selectionEnd;
      if (hasSelection) {
        const selected = value.slice(selectionStart, selectionEnd);
        const newValue =
          value.slice(0, selectionStart) +
          "<center>" +
          selected +
          "</center>" +
          value.slice(selectionEnd);
        applyToTextarea(
          newValue,
          selectionStart + 8,
          selectionEnd + 8,
        );
      } else {
        const newValue =
          value.slice(0, selectionStart) +
          "<center></center>" +
          value.slice(selectionStart);
        applyToTextarea(newValue, selectionStart + 8, selectionStart + 8);
      }
    }
    setMenuOpen(false);
  };

  const activeItemClass = "text-c-1";

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={t("post.actions.more")}
          className={cn(hasAnyActive && "text-c-1", className)}
        >
          <Ellipsis className={cn(iconClassName)} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="z-[70]">
        {/* Font submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className={cn(fontMatch && activeItemClass)}
          >
            <Type className="mr-2 h-4 w-4" />
            {t("createPost.formatFont")}
            {fontMatch && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="z-[70]">
            {FONT_NAMES.map((name) => (
              <DropdownMenuItem
                key={name}
                onSelect={() => handleFontSelect(name)}
                className={cn(
                  fontMatch?.fontName === name && activeItemClass,
                )}
              >
                <span className={FONT_LABELS[name].style}>
                  {FONT_LABELS[name].label}
                </span>
                {fontMatch?.fontName === name && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Size submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className={cn(sizeMatch && activeItemClass)}
          >
            <ALargeSmall className="mr-2 h-4 w-4" />
            {t("createPost.formatSize")}
            {sizeMatch && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="z-[70]">
            {SIZE_NAMES.map((name) => (
              <DropdownMenuItem
                key={name}
                onSelect={() => handleSizeSelect(name)}
                className={cn(
                  sizeMatch?.sizeName === name && activeItemClass,
                )}
              >
                {SIZE_LABELS[name]}
                {sizeMatch?.sizeName === name && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Code */}
        <DropdownMenuItem
          onSelect={handleCodeToggle}
          className={cn(codeMatch && activeItemClass)}
        >
          <CodeXml className="mr-2 h-4 w-4" />
          {t("createPost.formatCode")}
          {codeMatch && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>

        {/* Link */}
        <DropdownMenuItem
          onSelect={handleLinkToggle}
          className={cn(linkMatch && activeItemClass)}
        >
          <Link className="mr-2 h-4 w-4" />
          {t("createPost.formatLink")}
          {linkMatch && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>

        {/* Center */}
        <DropdownMenuItem
          onSelect={handleCenterToggle}
          className={cn(isCenterActive && activeItemClass)}
        >
          <AlignHorizontalSpaceAround className="mr-2 h-4 w-4" />
          {t("createPost.formatCenter")}
          {isCenterActive && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
