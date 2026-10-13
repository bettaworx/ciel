import { type ReactNode, useContext, useLayoutEffect, useRef } from "react";
import { PageChromeContext } from "@/components/shared/PageChromeContext";

/** Keeps controls and their spacing in flow, then pins them below the page header. */
export function StickyPageToolbar({ children }: { children: ReactNode }) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const chrome = useContext(PageChromeContext);
  const headerRef = chrome?.headerRef;
  const setToolbarAttached = chrome?.setToolbarAttached;

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    const header = headerRef?.current;
    if (!toolbar || !header || !setToolbarAttached) return;

    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const headerBounds = header.getBoundingClientRect();
      const toolbarBounds = toolbar.getBoundingClientRect();
      setToolbarAttached(
        toolbarBounds.top <= headerBounds.bottom + 0.5 &&
          toolbarBounds.bottom > headerBounds.bottom,
      );
    };
    const scheduleUpdate = () => {
      if (frame === undefined) frame = requestAnimationFrame(update);
    };
    update();
    // Capture also handles nested scrolling surfaces such as Storybook previews.
    document.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
    window.addEventListener("resize", scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(header);
    observer.observe(toolbar);
    if (header.parentElement) observer.observe(header.parentElement);

    return () => {
      document.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      setToolbarAttached(false);
    };
  }, [headerRef, setToolbarAttached]);

  return (
    <div
      ref={toolbarRef}
      data-slot="sticky-page-toolbar"
      className="sticky top-[var(--page-toolbar-offset,0px)] z-10 bg-background pt-[var(--page-toolbar-padding-top,0.75rem)] pb-3"
    >
      {children}
    </div>
  );
}
