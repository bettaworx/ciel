"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * The toast surface, matching the app's floating-card language (see
 * `DialogContent`). This lands on the toast element itself, so `toast.custom`
 * content renders inside it and must not repeat the surface or its padding.
 *
 * Note: sonner ships its own look under `[data-sonner-toast][data-styled=true]`,
 * a 0,2,0 selector injected into <head> at runtime — it beats plain utility
 * classes no matter the order. `unstyled: true` below drops that block so these
 * classes actually apply; sonner keeps only positioning and animation.
 */
// Background + outline only, like the dropdown panel — no shadow.
const toastSurfaceClassName =
  "w-full rounded-2xl border border-border bg-card text-card-foreground font-sans";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  // Same breakpoint that swaps the sidebar for the bottom bar, so "mobile" here
  // means "the bottom bar is on screen" — which is what we need to avoid.
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const toastOptions = {
    unstyled: true,
    classNames: {
      // p-3 matches the app's card rows, and keeps custom toasts (which render
      // their own row inside this element) from stacking a second inset.
      toast: `${toastSurfaceClassName} flex items-start gap-3 p-3`,
      content: "flex min-w-0 flex-1 flex-col gap-0.5",
      title: "text-sm font-medium",
      description: "text-sm text-muted-foreground",
      icon: "flex size-5 shrink-0 items-center justify-center [&_svg]:size-5",
      // Only the icon carries the semantic colour; the surface stays neutral.
      success: "[&_[data-icon]]:text-success",
      error: "[&_[data-icon]]:text-destructive",
      warning: "[&_[data-icon]]:text-warning",
      info: "[&_[data-icon]]:text-c-1",
      actionButton:
        "ml-auto shrink-0 rounded-full bg-c-1 px-3 py-1.5 text-xs font-medium text-c-foreground transition-colors hover:bg-c-2",
      cancelButton:
        "shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent",
    },
  } satisfies ToasterProps["toastOptions"];

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={isDesktop ? "bottom-right" : "top-center"}
      className="toaster group"
      // sonner hard-codes a font-family on the container and that rule survives
      // `unstyled`; inline styles sit outside the specificity contest.
      style={{ fontFamily: "inherit" }}
      icons={{
        success: <CircleCheck />,
        error: <CircleAlert />,
        warning: <TriangleAlert />,
        info: <Info />,
      }}
      toastOptions={toastOptions}
      {...props}
    />
  );
};

export { Toaster };
