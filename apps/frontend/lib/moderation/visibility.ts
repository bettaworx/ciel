import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type User = components["schemas"]["User"];

/**
 * What the client does about accounts the viewer has hidden, and about being
 * hidden by someone else.
 *
 * The server already decides what to send: a feed omits a hidden author's posts
 * entirely, and a page reached on purpose sends them with isMuted or isBlocking
 * set. Everything here is about the second case — turning those flags into the
 * cushion, the gate and the withheld fields — so that the same three flags are
 * not read and re-interpreted slightly differently in four components.
 *
 * Mirrors the vocabulary of the backend's ViewerScope: a decision, not a pile of
 * booleans.
 */

export type HiddenKind = "muted" | "blocked";

/**
 * Which cushion, if any, covers this post.
 *
 * Blocking wins when both flags arrive. They are separate decisions and both
 * indicators show beside the name, but the card can only say one thing, and
 * "blocked" is the stronger and more useful label.
 */
export function postCushion(
  post: Post,
  options: { skip?: boolean; revealed?: boolean } = {},
): HiddenKind | null {
  if (options.skip || options.revealed) return null;
  if (post.author?.isBlocking) return "blocked";
  if (post.author?.isMuted) return "muted";
  return null;
}

export type ProfileVisibility = {
  /**
   * The gate covering the post tabs, before the viewer opens it. Null when there
   * is nothing to gate.
   */
  gate: HiddenKind | null;
  /** This account blocked the viewer: the page explains that instead of listing posts. */
  blockedByOwner: boolean;
  /**
   * The bio is withheld across a block in either direction, so the placeholder
   * for an empty bio has to go too — "No bio yet" would be the page inventing a
   * fact about an account it is not showing.
   *
   * Muting does not withhold it: a mute hides a feed, it does not cut the two
   * accounts off from each other.
   */
  withholdBio: boolean;
  /** Follow is refused across a block either way, so the button is not offered. */
  canFollow: boolean;
};

export function profileVisibility(
  user: User | undefined,
  isOwnProfile: boolean,
): ProfileVisibility {
  const blocking = Boolean(user?.isBlocking);
  const blockedBy = Boolean(user?.isBlockedBy);
  const muted = Boolean(user?.isMuted);

  return {
    // Your own profile is never gated, whatever the flags say.
    gate: isOwnProfile ? null : blocking ? "blocked" : muted ? "muted" : null,
    blockedByOwner: blockedBy,
    withholdBio: blockedBy || blocking,
    canFollow: !isOwnProfile && !blockedBy && !blocking,
  };
}
