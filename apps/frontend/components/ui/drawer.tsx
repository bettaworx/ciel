"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/25", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    overlayClassName?: string;
    /** Drops the drag handle, for sheets that cannot be dragged shut. */
    hideHandle?: boolean;
  }
>(({ className, overlayClassName, hideHandle = false, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay className={overlayClassName} />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        // `bottom-0!` and `h-auto!` are the whole of vaul's keyboard handling
        // that we want gone. Its repositionInputs prop looks like the switch
        // for it, but the same flag also gates usePreventScroll — which on iOS
        // is what pins window.scrollY at 0 while the sheet is open. That has to
        // stay on: vaul's other half puts `position: fixed; top: -scrollY` on
        // the body, and with the window still scrolled the two disagree, so
        // every fixed element's hit area lands offset from where it is painted
        // (taps miss) and the scroll restored on close is wrong. So the prop is
        // left at its default and only the styling is overridden. vaul writes
        // exactly `height` and `bottom` inline, from onVisualViewportChange and
        // nowhere else; dragging animates `transform`, and snap points — the
        // other user of those two — are unused here. The keyboard is handled in
        // CSS below off --keyboard-inset instead.
        "fixed inset-x-0 bottom-0! z-50 flex h-auto! flex-col overflow-hidden rounded-t-[10px] border bg-card",
        // The sheet stays pinned to the bottom and pads its content up over the
        // keyboard instead of moving. Shifting `bottom` would leave it short of
        // offscreen when vaul closes it with translate3d(0, 100%, 0).
        //
        // The ceiling deliberately does not subtract the inset again: the
        // padding is already inside the box, so the content area works out to
        // 100dvh minus the keyboard minus the gap at the top on its own.
        "pb-[var(--keyboard-inset,0px)] max-h-[calc(100dvh-1.5rem)]",
        className,
      )}
      {...props}
    >
      {!hideHandle && (
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      )}
      {/* Once the sheet has a ceiling, the overflow has to go somewhere: this
          scrolls it instead of hiding it past the bottom edge. Kept a flex
          column so DrawerFooter's mt-auto still reaches the bottom. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {children}
      </div>
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-2", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
