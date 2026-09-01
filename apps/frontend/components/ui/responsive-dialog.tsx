"use client";

import { cn } from "@/lib/utils";
import { useModalFormFactor } from "@/lib/hooks/use-modal-form-factor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Keeps the title as the accessible name while the body carries it visually. */
  hideTitle?: boolean;
  description?: string;
  /**
   * `false` shuts every incidental way out — no close button, no drag handle,
   * no Escape, no click outside — leaving the footer as the only exit. For
   * content that is shown once and cannot be recovered.
   */
  dismissible?: boolean;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A dialog on a wide window and a bottom sheet on a narrow one, from one set of
 * props. Which one is decided when it opens and held until it closes — see
 * useModalFormFactor for why swapping mid-flow is worth avoiding.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  hideTitle = false,
  description,
  dismissible = true,
  footer,
  className,
  children,
}: ResponsiveDialogProps) {
  const formFactor = useModalFormFactor(open);

  // Nothing to show until the viewport has been measured.
  if (!formFactor) return null;

  const handleOpenChange = (next: boolean) => {
    if (!next && !dismissible) return;
    onOpenChange(next);
  };

  // Radix wants an accessible description; when there is nothing to add, the
  // title says it again rather than leaving the dialog undescribed.
  const describedBy = description ?? title;

  if (formFactor === "dialog") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          hideClose={!dismissible}
          className={className}
          onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          onInteractOutside={(e) => !dismissible && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className={cn(hideTitle && "sr-only")}>{title}</DialogTitle>
            <DialogDescription className={cn(!description && "sr-only")}>
              {describedBy}
            </DialogDescription>
          </DialogHeader>
          {children}
          {footer && <DialogFooter>{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} dismissible={dismissible} onOpenChange={handleOpenChange}>
      <DrawerContent hideHandle={!dismissible} className={cn("outline-none", className)}>
        {/* pt-6 when there is no handle to take up the top inset. */}
        <div className={cn("px-4 pb-4", dismissible ? "pt-2" : "pt-6")}>
          <DrawerHeader className="px-0 pt-0 text-left">
            <DrawerTitle className={cn(hideTitle && "sr-only")}>{title}</DrawerTitle>
            <DrawerDescription className={cn(!description && "sr-only")}>
              {describedBy}
            </DrawerDescription>
          </DrawerHeader>
          {children}
          {footer && (
            <DrawerFooter className="mt-6 flex-row justify-end gap-2 p-0">
              {footer}
            </DrawerFooter>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
