"use client";

import { type ChangeEvent, type RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaUploadButtonProps {
  /** Ref for the hidden file input element */
  inputRef: RefObject<HTMLInputElement | null>;
  /** MIME types accepted by the file input (e.g. "image/png,image/jpeg") */
  accept: string;
  /** Whether the file input allows multiple files */
  multiple?: boolean;
  /** Whether the button + input are disabled */
  disabled?: boolean;
  /** Called when file(s) are selected */
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Lucide icon component to display inside the button */
  icon: LucideIcon;
  /** Accessible label for the button */
  ariaLabel: string;
  /** Class name for the outer Button (controls size) */
  className?: string;
  /** Class name for the icon (controls icon size) */
  iconClassName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Reusable media upload trigger.
 *
 * Renders a hidden `<input type="file">` paired with a ghost icon `<Button>`.
 * The caller controls what file types are accepted, whether multi-select is
 * enabled, and which icon to display.
 */
export function MediaUploadButton({
  inputRef,
  accept,
  multiple = false,
  disabled = false,
  onChange,
  icon: Icon,
  ariaLabel,
  className,
  iconClassName,
}: MediaUploadButtonProps) {
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="hidden"
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn("text-muted-foreground hover:text-foreground transition-colors duration-160 ease", className)}
      >
        <Icon className={iconClassName} />
      </Button>
    </>
  );
}
