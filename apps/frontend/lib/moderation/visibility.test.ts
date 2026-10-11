import { describe, expect, it } from "vitest";
import { postCushion, profileVisibility } from "./visibility";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type User = components["schemas"]["User"];

function user(flags: Partial<User> = {}): User {
  return {
    id: "u1",
    username: "alice",
    createdAt: new Date().toISOString(),
    ...flags,
  } as User;
}

function post(flags: Partial<User> = {}): Post {
  return { id: "p1", author: user(flags) } as Post;
}

describe("postCushion", () => {
  it("covers a muted author", () => {
    expect(postCushion(post({ isMuted: true }))).toBe("muted");
  });

  it("covers a blocked author", () => {
    expect(postCushion(post({ isBlocking: true }))).toBe("blocked");
  });

  // Both indicators show beside the name, but a card can only say one thing.
  it("lets blocking win when both apply", () => {
    expect(postCushion(post({ isMuted: true, isBlocking: true }))).toBe("blocked");
  });

  it("leaves an ordinary author alone", () => {
    expect(postCushion(post())).toBeNull();
  });

  it("lifts once revealed, or where the caller already asked", () => {
    const muted = post({ isMuted: true });
    expect(postCushion(muted, { revealed: true })).toBeNull();
    expect(postCushion(muted, { skip: true })).toBeNull();
  });
});

describe("profileVisibility", () => {
  it("gates a muted account behind one reveal", () => {
    const v = profileVisibility(user({ isMuted: true }), false);
    expect(v.gate).toBe("muted");
    expect(v.withholdBio).toBe(false);
    expect(v.canFollow).toBe(true);
  });

  // A block cuts both accounts off from each other, so the bio goes and the
  // follow button would only ever fail.
  it("withholds the bio and the follow button across a block", () => {
    const blocking = profileVisibility(user({ isBlocking: true }), false);
    expect(blocking.gate).toBe("blocked");
    expect(blocking.withholdBio).toBe(true);
    expect(blocking.canFollow).toBe(false);

    const blockedBy = profileVisibility(user({ isBlockedBy: true }), false);
    expect(blockedBy.blockedByOwner).toBe(true);
    expect(blockedBy.withholdBio).toBe(true);
    expect(blockedBy.canFollow).toBe(false);
    // Being blocked is not something the viewer chose, so there is nothing to
    // reveal — the page explains instead.
    expect(blockedBy.gate).toBeNull();
  });

  it("never gates your own profile", () => {
    const v = profileVisibility(user({ isMuted: true, isBlocking: true }), true);
    expect(v.gate).toBeNull();
    expect(v.canFollow).toBe(false);
  });

  it("leaves an ordinary profile untouched", () => {
    const v = profileVisibility(user(), false);
    expect(v.gate).toBeNull();
    expect(v.blockedByOwner).toBe(false);
    expect(v.withholdBio).toBe(false);
    expect(v.canFollow).toBe(true);
  });

  it("copes with a profile that has not loaded", () => {
    const v = profileVisibility(undefined, false);
    expect(v.gate).toBeNull();
    expect(v.withholdBio).toBe(false);
  });
});
