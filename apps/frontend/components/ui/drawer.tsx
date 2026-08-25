"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const Drawer = (props: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    // Between them these two switch off everything vaul does to the body and
    // the window scroll, which is every path in it that calls window.scrollTo.
    //
    // vaul locks the background by pinning window.scrollY at 0 and offsetting
    // the body with `position: fixed; top: -scrollY`. The two halves read the
    // scroll position at different moments — one from a layout effect, the
    // other from a passive effect that runs a scroll event later — so the
    // offset it saves collapses to 0, and touching anywhere in the sheet tears
    // the first half down and re-records 0 again. The background jumps to the
    // top on open and lands somewhere arbitrary on close. At scroll position 0
    // every one of those values agrees, which is why it only shows up once the
    // page has been scrolled.
    //
    // Nothing here needs that: Radix wraps DrawerOverlay in RemoveScroll, which
    // blocks background scrolling with non-passive touchmove handlers and a
    // `body { overflow: hidden }` rule, and never writes a scroll offset — so
    // there is nothing to restore and nothing to lose. The sheet itself is the
    // shard it allows, so scrolling inside it still works.
    noBodyStyles
    // Also stops vaul writing inline height/bottom onto the sheet from
    // onVisualViewportChange; the keyboard is handled in CSS off
    // --keyboard-inset instead. See DrawerContent below.
    repositionInputs={false}
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
        "fixed inset-x-0 bottom-0 z-50 flex h-auto flex-col overflow-hidden rounded-t-[10px] border bg-card",
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
