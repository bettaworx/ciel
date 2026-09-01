import { describe, expect, it } from "vitest";

import { pickNextAccounts, refreshAccount, type AccountEntry } from "@/atoms/accounts";

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
