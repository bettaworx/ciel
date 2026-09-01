/**
 * Whether a cached query result contains anything written by this account.
 *
 * Used to narrow what a broadcast invalidation drops. Events like "this account
 * switched between public and private" reach every connected client, and
 * invalidating every timeline on each one turned a single settings toggle into a
 * refetch from everybody at once — while almost none of those timelines held the
 * account that changed.
 *
 * Unrecognised shapes return true. Being wrong in that direction costs a refetch
 * that was not needed; being wrong the other way leaves a stale post on screen
 * that the server has already stopped serving.
 */
export function cacheHoldsAuthor(data: unknown, username: string): boolean {
	if (data == null) return false;
	return walk(data, username, 0);
}

// Depth is bounded because the shapes are known: an infinite query is
// { pages: [{ items: [post] }] }, and a post embeds at most a reference and a
// parent. Without a limit a cyclic cache entry would hang the invalidation.
const MAX_DEPTH = 6;

function walk(value: unknown, username: string, depth: number): boolean {
	if (depth > MAX_DEPTH) return true;
	if (Array.isArray(value)) {
		return value.some((item) => walk(item, username, depth + 1));
	}
	if (typeof value !== 'object' || value === null) return false;

	const record = value as Record<string, unknown>;

	// A post: the thing we are actually looking for.
	if (isPostLike(record)) {
		if (authorUsername(record) === username) return true;
		// A quote or boost carries someone else's post inside it, and that is
		// exactly the case where the author changing matters most.
		if (record.reference && walk(record.reference, username, depth + 1)) return true;
		return false;
	}

	// Container shapes: infinite query pages, a page of items.
	for (const key of ['pages', 'items'] as const) {
		if (key in record) return walk(record[key], username, depth + 1);
	}

	// Something else entirely — a server info blob, a settings object. Refetching
	// those on a privacy change is pointless, but claiming to know they are
	// unaffected is worse, so say yes and let it refetch.
	return true;
}

function isPostLike(record: Record<string, unknown>): boolean {
	return 'id' in record && 'author' in record;
}

function authorUsername(record: Record<string, unknown>): string | undefined {
	const author = record.author;
	if (typeof author !== 'object' || author === null) return undefined;
	const name = (author as Record<string, unknown>).username;
	return typeof name === 'string' ? name : undefined;
}
