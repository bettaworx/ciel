"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/auth";
import { PostCard } from "@/components/PostCard";
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
  const me = useAtomValue(userAtom);
  const isUnread = !notification.readAt;

  const markSeen = useCallback(() => {
    // A grouped row covers several notifications; mark them all.
    if (isUnread) onSeen(notificationIds(notification));
  }, [isUnread, notification, onSeen]);

  const targetPostId = notificationTargetPostId(notification);

  const handleClick = useCallback(() => {
    if (targetPostId) {
      router.push(`/posts/${targetPostId}`);
      return;
    }
    // A follow notification has no post — send the user to the people who
    // followed them, which is their own followers list.
    if (notification.type === "follow" && me) {
      router.push(`/users/${encodeURIComponent(me.username)}/followers`);
    }
  }, [router, targetPostId, notification.type, me]);

  const displayType = notificationDisplayType(notification);
  const Icon = NOTIFICATION_ICONS[displayType];

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
          // The card's author is the person who acted, so badge the kind onto
          // their avatar instead of spending a row on an indicator.
          avatarBadge={<Icon className="h-3 w-3" />}
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
            onUserClick={(username) => router.push(`/users/${username}`)}
            className={cn(!isLast && "border-b border-border")}
          />
        </div>
      )}
    </div>
  );
}
