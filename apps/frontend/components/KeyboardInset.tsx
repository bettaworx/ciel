"use client";

import { useEffect } from "react";

/**
 * Publishes how much of the layout viewport the software keyboard is covering
 * as `--keyboard-inset` on the root element, for anything anchored to the
 * bottom of the screen to subtract.
 *
 * The measurement is taken against documentElement.clientHeight — the layout
 * viewport — rather than window.innerHeight, and that is the whole point.
 * Chromium honours `interactive-widget: resizes-content`, so the layout
 * viewport has already shrunk by the keyboard and this reports 0: there is
 * nothing left to compensate for, and nothing here can double-compensate. iOS
 * ignores that hint and leaves the layout viewport alone, so this reports the
 * real keyboard height. offsetTop covers Safari scrolling the visual viewport
 * to bring the focused field into view.
 *
 * One listener for the whole app, writing a CSS variable rather than React
 * state, so a timeline full of sheets does not re-render on every keystroke.
 */
export function KeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const covered =
        document.documentElement.clientHeight -
        viewport.height -
        viewport.offsetTop;
      // Toolbars sliding in and out and sub-pixel rounding both move this by a
      // few pixels; only a gap big enough to be a keyboard counts.
      document.documentElement.style.setProperty(
        "--keyboard-inset",
        `${covered > 24 ? Math.round(covered) : 0}px`,
      );
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return null;
}
