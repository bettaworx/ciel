import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  accountsAtom,
  orderedAccountsAtom,
  pickNextAccounts,
  refreshAccount,
  removeAccountAtom,
  updateCachedUnreadAtom,
  upsertAccountAtom,
  type AccountEntry,
} from "@/atoms/accounts";

function entry(userId: string, lastActiveAt?: number): AccountEntry {
  return {
    userId,
    username: userId,
    displayName: null,
    avatarUrl: null,
    cachedUnreadCount: 0,
    lastActiveAt,
  };
}

describe("pickNextAccounts", () => {
  it("offers the most recently used account first", () => {
    const picked = pickNextAccounts([entry("a", 1), entry("c", 3), entry("b", 2)], []);

    expect(picked.map((a) => a.userId)).toEqual(["c", "b", "a"]);
  });

  it("leaves out the accounts being left behind", () => {
    const picked = pickNextAccounts([entry("a", 1), entry("b", 2), entry("c", 3)], ["c", "a"]);

    expect(picked.map((a) => a.userId)).toEqual(["b"]);
  });

  it("sorts entries added before ordering existed last", () => {
    const picked = pickNextAccounts([entry("old"), entry("new", 5)], []);

    expect(picked.map((a) => a.userId)).toEqual(["new", "old"]);
  });

  it("returns nothing when every account is excluded", () => {
    expect(pickNextAccounts([entry("a", 1)], ["a"])).toEqual([]);
  });
});

describe("refreshAccount", () => {
  it("updates the profile of an account already listed", () => {
    const refreshed = refreshAccount([entry("a", 1)], {
      userId: "a",
      username: "renamed",
      displayName: "A",
      avatarUrl: null,
    });

    expect(refreshed[0]).toMatchObject({ username: "renamed", displayName: "A", lastActiveAt: 1 });
  });

  // The unread poll can resolve after a switch removed the account it asked
  // about; re-inserting it there is how a deleted account came back.
  it("does not put back an account that is no longer listed", () => {
    const accounts = [entry("a", 1)];
    const refreshed = refreshAccount(accounts, {
      userId: "gone",
      username: "gone",
      displayName: null,
      avatarUrl: null,
    });

    expect(refreshed).toBe(accounts);
  });
});

/**
 * The account list lives in localStorage through jotai's atomWithStorage, so
 * these pin what the switcher relies on from it: the list is read back when the
 * atom is first used, and every write atom saves its result.
 */
describe("accounts store", () => {
  let saved: Map<string, string>;

  beforeEach(() => {
    saved = new Map();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => void saved.set(key, value),
        removeItem: (key: string) => void saved.delete(key),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Mounting is what reads storage, as it is for a component in the app.
  function mountedStore() {
    const store = createStore();
    store.sub(orderedAccountsAtom, () => {});
    return store;
  }

  it("restores the accounts saved by an earlier page load", () => {
    saved.set("ciel:accounts", JSON.stringify([entry("a", 1), entry("b", 2)]));

    const store = mountedStore();

    expect(store.get(orderedAccountsAtom).map((a) => a.userId)).toEqual(["b", "a"]);
  });

  it("saves every change for the next page load", () => {
    const store = mountedStore();
    const profile = (userId: string) => ({
      userId,
      username: userId,
      displayName: null,
      avatarUrl: null,
    });

    store.set(upsertAccountAtom, profile("a"));
    store.set(upsertAccountAtom, profile("b"));
    store.set(updateCachedUnreadAtom, { userId: "a", count: 3 });
    store.set(removeAccountAtom, "b");

    expect(JSON.parse(saved.get("ciel:accounts") ?? "null")).toEqual([
      { ...profile("a"), cachedUnreadCount: 3 },
    ]);
  });

  it("starts empty when the saved list cannot be read", () => {
    saved.set("ciel:accounts", "{not json");

    expect(mountedStore().get(accountsAtom)).toEqual([]);
  });
});
