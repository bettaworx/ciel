"use client";

import * as React from "react";

interface ScrollLockTarget {
  bodyStyle: {
    overflow: string;
    paddingRight: string;
  };
  htmlStyle: {
    overflow: string;
  };
  getBodyPaddingRight: () => number;
  getScrollbarWidth: () => number;
}

export function createBodyScrollLockManager(target: ScrollLockTarget) {
  let lockCount = 0;
  let previousBodyOverflow = "";
  let previousBodyPaddingRight = "";
  let previousHtmlOverflow = "";

  return {
    lock() {
      if (lockCount === 0) {
        previousBodyOverflow = target.bodyStyle.overflow;
        previousBodyPaddingRight = target.bodyStyle.paddingRight;
        previousHtmlOverflow = target.htmlStyle.overflow;

        const scrollbarWidth = target.getScrollbarWidth();
        const computedPaddingRight = target.getBodyPaddingRight();

        target.bodyStyle.overflow = "hidden";
        target.htmlStyle.overflow = "hidden";

        if (scrollbarWidth > 0) {
          target.bodyStyle.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
        }
      }

      lockCount += 1;
    },
    unlock() {
      if (lockCount === 0) {
        return;
      }

      lockCount -= 1;

      if (lockCount > 0) {
        return;
      }

      target.bodyStyle.overflow = previousBodyOverflow;
      target.bodyStyle.paddingRight = previousBodyPaddingRight;
      target.htmlStyle.overflow = previousHtmlOverflow;
    },
    reset() {
      lockCount = 0;
      previousBodyOverflow = "";
      previousBodyPaddingRight = "";
      previousHtmlOverflow = "";
    },
  };
}

function getDefaultBodyScrollLockManager() {
  if (typeof window === "undefined") {
    return null;
  }

  return createBodyScrollLockManager({
    bodyStyle: document.body.style,
    htmlStyle: document.documentElement.style,
    getBodyPaddingRight: () =>
      Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0,
    getScrollbarWidth: () =>
      window.innerWidth - document.documentElement.clientWidth,
  });
}

let defaultBodyScrollLockManager: ReturnType<
  typeof createBodyScrollLockManager
> | null = null;

export function useBodyScrollLock(locked: boolean) {
  React.useEffect(() => {
    if (!locked) {
      return;
    }

    defaultBodyScrollLockManager ??= getDefaultBodyScrollLockManager();
    defaultBodyScrollLockManager?.lock();

    return () => {
      defaultBodyScrollLockManager?.unlock();
    };
  }, [locked]);
}
