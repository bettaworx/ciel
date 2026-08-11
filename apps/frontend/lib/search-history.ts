/** How many past searches are kept in storage. */
export const MAX_SEARCH_HISTORY = 20;

/** How many are ever offered in the dropdown at once. */
export const MAX_HISTORY_SUGGESTIONS = 5;

/**
 * Records a search, most recent first.
 *
 * Repeating a search promotes the existing entry instead of adding a second
 * copy, so the list stays a set ordered by recency.
 */
export function pushSearchHistory(history: readonly string[], query: string): string[] {
	const trimmed = query.trim();
	if (!trimmed) return [...history];
	return [trimmed, ...history.filter((entry) => entry !== trimmed)].slice(
		0,
		MAX_SEARCH_HISTORY,
	);
}

/** Drops one past search. Unknown entries leave the list unchanged. */
export function removeSearchHistory(
	history: readonly string[],
	query: string,
): string[] {
	return history.filter((entry) => entry !== query);
}

/**
 * The history entries worth offering for what has been typed so far: all of
 * them while the box is empty, otherwise the ones containing the input.
 *
 * More entries are stored than are ever shown, so that filtering still has
 * something to find once the user starts typing.
 */
export function filterSearchHistory(
	history: readonly string[],
	input: string,
): string[] {
	const trimmed = input.trim();
	if (!trimmed) return history.slice(0, MAX_HISTORY_SUGGESTIONS);

	const needle = trimmed.toLowerCase();
	return history
		.filter((entry) => {
			// Offering the exact thing already typed would be a no-op suggestion.
			if (entry === trimmed) return false;
			return entry.toLowerCase().includes(needle);
		})
		.slice(0, MAX_HISTORY_SUGGESTIONS);
}

/** Narrows unknown storage content back to a history list. */
export function isSearchHistory(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
