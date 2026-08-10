/** The three follow lists, matching their URL segments. */
export type FollowTab = "followers" | "following" | "followers_you_follow";

export const FOLLOW_TABS: readonly FollowTab[] = [
  "following",
  "followers",
  "followers_you_follow",
];

export function isFollowTab(value: string): value is FollowTab {
  return (FOLLOW_TABS as readonly string[]).includes(value);
}
