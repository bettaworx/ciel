"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ToggleRow — a single toggle: icon + title + description, Switch on right.
// ---------------------------------------------------------------------------

interface ToggleRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  /** Optional icon displayed to the left of the title. */
  icon?: LucideIcon;
}

export function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  icon: Icon,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        disabled && "opacity-50",
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && (
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
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
// NestedToggle — a toggle row with collapsible children.
//
// - Children are shown when the parent switch is ON.
// - A caret arrow rotates to indicate open/closed state.
// - On mobile, children have no left indent to avoid cramping text.
// - On md+ screens, children are indented for visual hierarchy.
//
// Uses CSS grid animation instead of Radix Collapsible to avoid nesting issues.
// ---------------------------------------------------------------------------

interface NestedToggleProps {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  /** Icon displayed to the left of the title. */
  icon?: LucideIcon;
  /** Indent children (use for 3rd-level nesting and deeper). */
  indent?: boolean;
  children: ReactNode;
}

export function NestedToggle({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  icon: Icon,
  indent = false,
  children,
}: NestedToggleProps) {
  const [open, setOpen] = useState(checked);
  const prevChecked = useRef(checked);

  // Sync open state with checked: ON → open, OFF → close.
  // Only reacts to actual transitions to avoid overriding manual caret toggles.
  useEffect(() => {
    if (checked !== prevChecked.current) {
      setOpen(checked);
      prevChecked.current = checked;
    }
  }, [checked]);

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between gap-4 py-3",
          disabled && "opacity-50",
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 cursor-pointer",
              open && "rotate-90",
            )}
            onClick={() => setOpen((prev) => !prev)}
          />
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        </div>
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className={cn(indent && "ml-6 pl-4 border-l border-border", !checked && "opacity-50")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
