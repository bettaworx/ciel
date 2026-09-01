/** The two search result tabs, matching the `type` query parameter. */
export type SearchTab = "posts" | "users";

export const SEARCH_TABS: readonly SearchTab[] = ["posts", "users"];

export const DEFAULT_SEARCH_TAB: SearchTab = "posts";

export function isSearchTab(value: string | null | undefined): value is SearchTab {
	return (SEARCH_TABS as readonly string[]).includes(value ?? "");
}

/**
 * The tab a `type` parameter asks for, falling back to posts.
 *
 * Search URLs get shared and hand-edited, so an unrecognised value reads as a
 * typo to forgive rather than a page that does not exist.
 */
export function resolveSearchTab(value: string | null | undefined): SearchTab {
	return isSearchTab(value) ? value : DEFAULT_SEARCH_TAB;
}

/** The canonical URL for a search, used for both navigation and tab switches. */
export function searchUrl(query: string, tab: SearchTab): string {
	const params = new URLSearchParams({ q: query });
	// Posts is the default, so leave it out and keep the shared URL short.
	if (tab !== DEFAULT_SEARCH_TAB) params.set("type", tab);
	return `/search?${params.toString()}`;
}
