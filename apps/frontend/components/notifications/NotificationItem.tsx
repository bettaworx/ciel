"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PostCard, type PostCardIndicator } from "@/components/PostCard";
import {
  NOTIFICATION_ICONS,
  NotificationRow,
} from "@/components/notifications/NotificationRow";
import {
  notificationDisplayType,
  notificationIds,
  notificationTargetPostId,
  rendersAsPostCard,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";

type Notification = components["schemas"]["Notification"];

export function NotificationItem({
  notification,
  isLast,
  onSeen,
}: {
  notification: Notification;
  isLast: boolean;
  onSeen: (ids: readonly string[]) => void;
}) {
  const router = useRouter();
  const t = useTranslations("notifications");
  const isUnread = !notification.readAt;

  const markSeen = useCallback(() => {
    // A grouped row covers several notifications; mark them all.
    if (isUnread) onSeen(notificationIds(notification));
  }, [isUnread, notification, onSeen]);

  const targetPostId = notificationTargetPostId(notification);

  const handleClick = useCallback(() => {
    if (targetPostId) router.push(`/posts/${targetPostId}`);
  }, [router, targetPostId]);

  const actorName =
    notification.actor?.displayName || notification.actor?.username || "";
  const displayType = notificationDisplayType(notification);
  const Icon = NOTIFICATION_ICONS[displayType];
  const indicator: PostCardIndicator = {
    icon: <Icon className="h-3.5 w-3.5" />,
    label: t(`types.${displayType}`, { name: actorName }),
    createdAt: notification.createdAt,
    actorUserId: notification.actor?.id,
  };

  return (
    <div
      onMouseEnter={markSeen}
      onFocus={markSeen}
      // Touch devices never fire hover, so any interaction has to count as seen.
      onClick={markSeen}
      className={cn(
        "transition-colors duration-500",
        isUnread && "notification-unread-tint",
      )}
    >
      {rendersAsPostCard(notification) && notification.post ? (
        <PostCard
          post={notification.post}
          onUserClick={(username) => router.push(`/users/${username}`)}
          isLast={isLast}
          indicator={indicator}
        />
      ) : (
        <div
          role="link"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          className="cursor-pointer hover:bg-accent/40"
        >
          {/* The divider belongs to the list, not to the row itself. */}
          <NotificationRow
            notification={notification}
            className={cn(!isLast && "border-b border-border")}
          />
        </div>
      )}
    </div>
  );
}
