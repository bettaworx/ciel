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
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { applyFormatToTextarea } from "./applyFormat";
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
  /** Whether to include Font/Size in the mobile Drawer (default: true) */
  includeFontSize?: boolean;
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
  includeFontSize = true,
  className,
  iconClassName,
}: FormatOverflowMenuProps) {
  const t = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // On desktop, Font/Size have dedicated buttons so don't count them here
  const hasAnyActive = isDesktop
    ? codeMatch !== null || linkMatch !== null || isCenterActive
    : fontMatch !== null ||
      sizeMatch !== null ||
      codeMatch !== null ||
      linkMatch !== null ||
      isCenterActive;

  const apply = (newValue: string, newStart: number, newEnd: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    applyFormatToTextarea(textarea, newValue, newStart, newEnd, setContent, setSelectionRange);
  };

  // --- Font handlers ---
  const handleFontSelect = (fontName: FontName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (fontMatch && fontMatch.fontName === fontName) {
      const { newValue, newStart, newEnd } = removeFontDecoration(value, selectionStart, selectionEnd, fontMatch);
      apply(newValue, newStart, newEnd);
    } else if (fontMatch) {
      const { newValue, newStart, newEnd } = removeFontDecoration(value, selectionStart, selectionEnd, fontMatch);
      const result = insertFontDecoration(newValue, newStart, newEnd, fontName);
      apply(result.newValue, result.newStart, result.newEnd);
    } else {
      const { newValue, newStart, newEnd } = insertFontDecoration(value, selectionStart, selectionEnd, fontName);
      apply(newValue, newStart, newEnd);
    }
    setDrawerOpen(false);
  };

  // --- Size handlers ---
  const handleSizeSelect = (sizeName: SizeName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (sizeMatch && sizeMatch.sizeName === sizeName) {
      const { newValue, newStart, newEnd } = removeSizeDecoration(value, selectionStart, selectionEnd, sizeMatch);
      apply(newValue, newStart, newEnd);
    } else if (sizeMatch) {
      const { newValue, newStart, newEnd } = removeSizeDecoration(value, selectionStart, selectionEnd, sizeMatch);
      const result = insertSizeDecoration(newValue, newStart, newEnd, sizeName);
      apply(result.newValue, result.newStart, result.newEnd);
    } else {
      const { newValue, newStart, newEnd } = insertSizeDecoration(value, selectionStart, selectionEnd, sizeName);
      apply(newValue, newStart, newEnd);
    }
    setDrawerOpen(false);
  };

  // --- Code handler ---
  const handleCodeToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (codeMatch) {
      const { newValue, newStart, newEnd } = removeCodeDecoration(value, selectionStart, selectionEnd, codeMatch);
      apply(newValue, newStart, newEnd);
    } else {
      const hasSelection = selectionStart !== selectionEnd;
      if (!hasSelection) {
        apply(value.slice(0, selectionStart) + "``" + value.slice(selectionStart), selectionStart + 1, selectionStart + 1);
      } else {
        const selected = value.slice(selectionStart, selectionEnd);
        if (selected.includes("\n")) {
          const prefix = "```\n";
          const suffix = "\n```";
          apply(
            value.slice(0, selectionStart) + prefix + selected + suffix + value.slice(selectionEnd),
            selectionStart + prefix.length,
            selectionEnd + prefix.length,
          );
        } else {
          apply(
            value.slice(0, selectionStart) + "`" + selected + "`" + value.slice(selectionEnd),
            selectionStart + 1,
            selectionEnd + 1,
          );
        }
      }
    }
    setDrawerOpen(false);
  };

  // --- Link handler ---
  const handleLinkToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (linkMatch) {
      const { newValue, newStart, newEnd } = removeLinkDecoration(value, selectionStart, selectionEnd, linkMatch);
      apply(newValue, newStart, newEnd);
    } else {
      const hasSelection = selectionStart !== selectionEnd;
      if (hasSelection) {
        const selected = value.slice(selectionStart, selectionEnd);
        if (/^https?:\/\/\S+$/.test(selected.trim())) {
          apply(value.slice(0, selectionStart) + "[](" + selected + ")" + value.slice(selectionEnd), selectionStart + 1, selectionStart + 1);
        } else {
          const cursor = selectionStart + 1 + selected.length + 2;
          apply(value.slice(0, selectionStart) + "[" + selected + "]()" + value.slice(selectionEnd), cursor, cursor);
        }
      } else {
        apply(value.slice(0, selectionStart) + "[](url)" + value.slice(selectionStart), selectionStart + 1, selectionStart + 1);
      }
    }
    setDrawerOpen(false);
  };

  // --- Center handler ---
  const handleCenterToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    if (isCenterActive) {
      const { newValue, newStart, newEnd } = removeDecoration(value, selectionStart, selectionEnd, "<center>", "</center>");
      apply(newValue, newStart, newEnd);
    } else {
      const hasSelection = selectionStart !== selectionEnd;
      if (hasSelection) {
        const selected = value.slice(selectionStart, selectionEnd);
        apply(
          value.slice(0, selectionStart) + "<center>" + selected + "</center>" + value.slice(selectionEnd),
          selectionStart + 8,
          selectionEnd + 8,
        );
      } else {
        apply(
          value.slice(0, selectionStart) + "<center></center>" + value.slice(selectionStart),
          selectionStart + 8,
          selectionStart + 8,
        );
      }
    }
    setDrawerOpen(false);
  };

  const activeClass = "text-c-1";

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label={t("post.actions.more")}
      className={cn(hasAnyActive && "text-c-1", className)}
    >
      <Ellipsis className={cn(iconClassName)} />
    </Button>
  );

  // ---------------------------------------------------------------------------
  // Desktop: DropdownMenu (Code, Link, Center only — Font/Size have dedicated buttons)
  // ---------------------------------------------------------------------------
  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[70]">
          <DropdownMenuItem
            className={cn(codeMatch && activeClass)}
            onClick={handleCodeToggle}
          >
            <CodeXml />
            {t("createPost.formatCode")}
            {codeMatch && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(linkMatch && activeClass)}
            onClick={handleLinkToggle}
          >
            <Link />
            {t("createPost.formatLink")}
            {linkMatch && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(isCenterActive && activeClass)}
            onClick={handleCenterToggle}
          >
            <AlignHorizontalSpaceAround />
            {t("createPost.formatCenter")}
            {isCenterActive && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ---------------------------------------------------------------------------
  // Mobile: Drawer (Font, Size, Code, Link, Center)
  // Font and Size open as nested Drawers on top of the main drawer
  // ---------------------------------------------------------------------------
  const itemClass = "w-full justify-start gap-2";

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <div className="flex flex-col gap-1 p-2 pb-4">
          {/* Font — nested Drawer (card layout only) */}
          {includeFontSize && (
            <Drawer nested>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(itemClass, fontMatch && activeClass)}
                >
                  <Type className="h-4 w-4" />
                  {t("createPost.formatFont")}
                  <span className="ml-auto flex items-center gap-1">
                    {fontMatch && <Check className="h-4 w-4" />}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex flex-col gap-1 p-2 pb-4">
                  {FONT_NAMES.map((name) => (
                    <Button
                      key={name}
                      variant="ghost"
                      className={cn(
                        itemClass,
                        fontMatch?.fontName === name && activeClass,
                      )}
                      onClick={() => handleFontSelect(name)}
                    >
                      <span className={FONT_LABELS[name].style}>
                        {FONT_LABELS[name].label}
                      </span>
                      {fontMatch?.fontName === name && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </Button>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {/* Size — nested Drawer (card layout only) */}
          {includeFontSize && (
            <Drawer nested>
              <DrawerTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(itemClass, sizeMatch && activeClass)}
                >
                  <ALargeSmall className="h-4 w-4" />
                  {t("createPost.formatSize")}
                  <span className="ml-auto flex items-center gap-1">
                    {sizeMatch && <Check className="h-4 w-4" />}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="flex flex-col gap-1 p-2 pb-4">
                  {SIZE_NAMES.map((name) => (
                    <Button
                      key={name}
                      variant="ghost"
                      className={cn(
                        itemClass,
                        sizeMatch?.sizeName === name && activeClass,
                      )}
                      onClick={() => handleSizeSelect(name)}
                    >
                      {SIZE_LABELS[name]}
                      {sizeMatch?.sizeName === name && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </Button>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          )}

          {/* Code */}
          <Button
            variant="ghost"
            className={cn(itemClass, codeMatch && activeClass)}
            onClick={handleCodeToggle}
          >
            <CodeXml className="h-4 w-4" />
            {t("createPost.formatCode")}
            {codeMatch && <Check className="ml-auto h-4 w-4" />}
          </Button>

          {/* Link */}
          <Button
            variant="ghost"
            className={cn(itemClass, linkMatch && activeClass)}
            onClick={handleLinkToggle}
          >
            <Link className="h-4 w-4" />
            {t("createPost.formatLink")}
            {linkMatch && <Check className="ml-auto h-4 w-4" />}
          </Button>

          {/* Center */}
          <Button
            variant="ghost"
            className={cn(itemClass, isCenterActive && activeClass)}
            onClick={handleCenterToggle}
          >
            <AlignHorizontalSpaceAround className="h-4 w-4" />
            {t("createPost.formatCenter")}
            {isCenterActive && <Check className="ml-auto h-4 w-4" />}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
