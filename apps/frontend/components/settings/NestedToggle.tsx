"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ToggleRow — a single toggle: title + description on the left, Switch right.
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        disabled && "opacity-50",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NestedToggle — a toggle row whose children are shown in a collapsible area.
//
// - Clicking the text area toggles collapse open/closed.
// - Clicking the switch toggles the checked state (independent of collapse).
// - On mobile, children have no left indent to avoid cramping text.
// - On md+ screens, children are indented for visual hierarchy.
// ---------------------------------------------------------------------------

interface NestedToggleProps {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function NestedToggle({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  children,
}: NestedToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open}>
      <div
        className={cn(
          "flex items-center justify-between gap-4 py-3",
          disabled && "opacity-50",
        )}
      >
        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
        >
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </button>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        </div>
      </div>
      <CollapsibleContent>
        <div className="md:ml-6 md:pl-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
