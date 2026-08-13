"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronRight, ChevronsUpDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * The rounded card that settings rows sit in, optionally under a section
 * heading. Dividers come from the adjacent sibling selector rather than
 * interleaved <Separator> elements, so callers can just list their rows.
 */
export function SettingsRowGroup({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="space-y-1.5">
      {title && (
        <h2 className="text-sm font-medium text-muted-foreground">
          {title}
        </h2>
      )}
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-2xl bg-card",
          "[&>*+*]:border-t [&>*+*]:border-border",
          className,
        )}
      >
        {children}
      </div>
    </section>
  );
}

interface SettingsRowProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Button>, "children"> {
  icon?: LucideIcon;
  label: string;
  /** Current value, shown before the caret. Its presence picks the caret. */
  value?: string;
  /** Navigates instead of acting. */
  href?: string;
}

/**
 * One row of a settings list. Navigating rows get a right caret; rows that open
 * a picker get the up/down caret and show their current value.
 *
 * Forwards its ref and props so it can be a Radix trigger via asChild.
 */
export const SettingsRow = React.forwardRef<HTMLButtonElement, SettingsRowProps>(
  ({ icon: Icon, label, value, href, className, ...props }, ref) => {
    const body = (
      <>
        <span className="flex items-center gap-3">
          {Icon && <Icon />}
          <span>{label}</span>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {value}
          {value === undefined ? <ChevronRight /> : <ChevronsUpDown />}
        </span>
      </>
    );

    return (
      // Colour overrides ride on the Button so tailwind-merge drops list_row's
      // text-foreground; on a Link child both would survive.
      <Button
        ref={ref}
        variant="list_row"
        size="list"
        className={className}
        asChild={href !== undefined}
        {...props}
      >
        {href !== undefined ? <Link href={href}>{body}</Link> : body}
      </Button>
    );
  },
);
SettingsRow.displayName = "SettingsRow";

/**
 * A settings row that toggles a boolean. It is a <label> rather than the Button
 * the other rows use, so the whole row is a tap target without nesting a
 * control inside a control.
 */
export function SettingsSwitchRow({
  icon: Icon,
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon?: LucideIcon;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = React.useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        buttonVariants({ variant: "list_row", size: "list" }),
        "cursor-pointer",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <span className="flex items-center gap-3">
        {Icon && <Icon />}
        <span>{label}</span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </label>
  );
}

interface SettingsSelectRowProps<T extends string> {
  icon?: LucideIcon;
  label: string;
  value: T;
  /** Labels are expected pre-translated, so this stays free of next-intl. */
  options: readonly { value: T; label: string }[];
  onValueChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * A settings row that picks one of a short list of values: a dropdown on
 * desktop, a bottom sheet on touch — the same split the image-crop aspect
 * ratio picker uses.
 */
export function SettingsSelectRow<T extends string>({
  icon,
  label,
  value,
  options,
  onValueChange,
  disabled,
}: SettingsSelectRowProps<T>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const trigger = (
    <SettingsRow
      icon={icon}
      label={label}
      value={options.find((o) => o.value === value)?.label ?? ""}
      disabled={disabled}
    />
  );

  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => onValueChange(next as T)}
          >
            {options.map((opt) => (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                {opt.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <div className="flex flex-col gap-1 p-2 pb-4">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                onValueChange(opt.value);
                setDrawerOpen(false);
              }}
            >
              {opt.label}
              {value === opt.value && <Check className="ml-auto h-4 w-4" />}
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
