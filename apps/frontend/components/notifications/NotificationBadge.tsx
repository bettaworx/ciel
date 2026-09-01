"use client";

import { useTranslations } from "next-intl";
import { useUnreadNotificationCount } from "@/lib/hooks/use-queries";
import { cn } from "@/lib/utils";

/** Counts above this are shown as "9+". */
const MAX_DISPLAYED = 9;

type NotificationBadgeProps = {
  /**
   * "dot" is for icon-only contexts where a number has nowhere to sit without
   * covering the glyph; "count" shows the number.
   */
  variant?: "dot" | "count";
  /** Positioning is left to the caller so this works inline or as an overlay. */
  className?: string;
};

/**
 * Unread indicator. Renders nothing when there is nothing unread.
 *
 * Not built on ui/badge: that is a bordered pill sized for inline labels, which
 * does not sit well as a small count over an icon.
 */
export function NotificationBadge({
  variant = "count",
  className,
}: NotificationBadgeProps) {
  const t = useTranslations("notifications");
  const { data } = useUnreadNotificationCount();
  const count = data?.count ?? 0;

  if (count <= 0) return null;

  // The visual label is truncated (or absent, for a dot), so expose the real
  // count to assistive tech.
  const label = t("unreadCount", { count });

  if (variant === "dot") {
    return (
      <span
        role="status"
        aria-label={label}
        className={cn(
          "pointer-events-none block h-1.5 w-1.5 rounded-full bg-c-1 ring-2 ring-background",
          className,
        )}
      />
    );
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "pointer-events-none flex h-4 min-w-4 items-center justify-center",
        "rounded-full bg-c-1 px-1 text-[9px] leading-none font-semibold text-c-foreground",
        className,
      )}
    >
      {count > MAX_DISPLAYED ? `${MAX_DISPLAYED}+` : count}
    </span>
  );
}
