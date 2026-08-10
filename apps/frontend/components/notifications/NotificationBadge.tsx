"use client";

import { useTranslations } from "next-intl";
import { useUnreadNotificationCount } from "@/lib/hooks/use-queries";
import { cn } from "@/lib/utils";

/** Counts above this are shown as "9+". */
const MAX_DISPLAYED = 9;

/**
 * Unread count overlaid on the notification icon. Renders nothing at zero.
 *
 * Not built on ui/badge: that is a bordered pill sized for inline labels, which
 * does not sit well as a small count dot over an icon.
 */
export function NotificationBadge({ className }: { className?: string }) {
  const t = useTranslations("notifications");
  const { data } = useUnreadNotificationCount();
  const count = data?.count ?? 0;

  if (count <= 0) return null;

  return (
    <span
      // The visual label is truncated to "9+", so expose the real count to
      // assistive tech.
      aria-label={t("unreadCount", { count })}
      className={cn(
        "pointer-events-none absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center",
        "rounded-full bg-c-1 px-1 text-[10px] leading-none font-semibold text-white",
        className,
      )}
    >
      {count > MAX_DISPLAYED ? `${MAX_DISPLAYED}+` : count}
    </span>
  );
}
