import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type Notification = components["schemas"]["Notification"];

/**
 * A "pure boost" is a post that only re-shares another post: no text of its own,
 * just a reference. A boost that carries text is a quote.
 */
export function isPureBoost(post: Post): boolean {
  return post.content === "" && !!post.referenceId;
}

/**
 * Whether a notification should render as a full PostCard rather than a compact
 * row. Replies, mentions and quotes carry text worth reading in place; reactions
 * and pure boosts do not.
 */
export function rendersAsPostCard(notification: Notification): boolean {
  const post = notification.post;
  if (!post) return false;
  switch (notification.type) {
    case "reply":
    case "mention":
      return true;
    case "boost":
      return !isPureBoost(post);
    default:
      return false;
  }
}

/**
 * How a notification is presented. Widens the API's `type` with `quote`, which
 * the backend stores as a `boost` — the difference is whether the boosting post
 * carries text of its own.
 */
export type NotificationDisplayType =
  | Notification["type"]
  | "quote";

export function notificationDisplayType(
  notification: Notification,
): NotificationDisplayType {
  const post = notification.post;
  if (notification.type === "boost" && post && !isPureBoost(post)) {
    return "quote";
  }
  return notification.type;
}

/**
 * Whether a row shows the type on the left and its actors as a row of avatars.
 *
 * Only the groupable kinds do: replies, mentions and quotes each carry their own
 * text and always have exactly one actor, so they keep the plain layout. Note
 * this is not `rendersAsPostCard` — toasts use the row for every kind.
 */
export function usesActorRowLayout(type: NotificationDisplayType): boolean {
  return type === "reaction" || type === "boost";
}

/** Actors to show on a row, newest first. Falls back to the single actor. */
export function notificationActors(
  notification: Notification,
): NonNullable<Notification["actors"]> {
  if (notification.actors?.length) return notification.actors;
  return notification.actor ? [notification.actor] : [];
}

/** How many notifications a row stands for. */
export function notificationCount(notification: Notification): number {
  return notification.count ?? 1;
}

/**
 * Every notification a row covers. A grouped row has to mark all of its members
 * read, not just the one whose id it carries.
 */
export function notificationIds(notification: Notification): string[] {
  return notification.notificationIds?.length
    ? notification.notificationIds
    : [notification.id];
}

/**
 * Text to show under a notification.
 *
 * A pure boost carries no text of its own, so fall back to the post it boosted —
 * otherwise boost notifications would show nothing at all.
 */
export function notificationExcerpt(notification: Notification): string {
  const post = notification.post;
  if (!post) return "";
  return post.content || post.reference?.content || "";
}

/** Post a notification should link to when tapped. */
export function notificationTargetPostId(
  notification: Notification,
): string | undefined {
  const post = notification.post;
  if (!post) return undefined;
  // A pure boost has no content of its own — send the user to what was boosted.
  if (notification.type === "boost" && isPureBoost(post)) {
    return post.referenceId ?? post.id;
  }
  return post.id;
}
