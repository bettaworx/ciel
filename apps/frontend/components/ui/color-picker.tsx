"use client";

import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  onValueCommit?: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

export function ColorPicker({
  id,
  value,
  onValueChange,
  onValueCommit,
  ariaLabel,
  className,
}: ColorPickerProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <div className={cn("space-y-3", className)} onPointerUp={() => onValueCommit?.(value)}>
      <HexColorPicker
        color={value}
        onChange={(next) => onValueChange(next.toUpperCase())}
        className="!h-48 !w-full [&_.react-colorful__hue]:mt-3 [&_.react-colorful__hue]:h-3 [&_.react-colorful__hue]:rounded-full [&_.react-colorful__pointer]:h-5 [&_.react-colorful__pointer]:w-5 [&_.react-colorful__pointer]:border-2 [&_.react-colorful__pointer]:border-background [&_.react-colorful__pointer]:shadow-md [&_.react-colorful__saturation]:rounded-md"
      />
      <Input
        id={id}
        value={draft}
        aria-label={ariaLabel}
        maxLength={7}
        spellCheck={false}
        className="font-mono uppercase"
        onChange={(event) => {
          const next = event.target.value.toUpperCase();
          setDraft(next);
          if (/^#[0-9A-F]{6}$/.test(next)) onValueChange(next);
        }}
        onBlur={() => {
          setDraft(value);
          onValueCommit?.(value);
        }}
      />
    </div>
  );
}
