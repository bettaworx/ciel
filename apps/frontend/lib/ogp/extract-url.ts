import * as mfm from 'mfm-js';
import type { MfmNode } from 'mfm-js';

/**
 * Extract the first URL from post content using the mfm-js AST.
 *
 * Walks the MFM AST depth-first (left-to-right) and returns the first URL
 * found in a `url` node or `link` node. Only `http:` and `https:` URLs are
 * returned.
 *
 * Returns `null` if no URL is found.
 */
export function extractFirstUrl(content: string): string | null {
	if (!content) return null;

	const nodes = mfm.parse(content);
	return findFirstUrl(nodes);
}

function findFirstUrl(nodes: MfmNode[]): string | null {
	for (const node of nodes) {
		// Bare URL:  https://example.com
		if (node.type === 'url') {
			const url = (node.props as { url: string }).url;
			if (isSafeUrl(url)) return url;
		}

		// Labelled link:  [text](https://example.com)
		if (node.type === 'link') {
			const url = (node.props as { url: string }).url;
			if (isSafeUrl(url)) return url;
		}

		// Recurse into children (e.g. bold, italic wrappers may contain URLs).
		if ('children' in node && Array.isArray(node.children)) {
			const found = findFirstUrl(node.children as MfmNode[]);
			if (found) return found;
		}
	}

	return null;
}

/**
 * Minimal URL safety check – only allow http/https.
 * Mirrors the sanitizeUrl logic in MfmNode.tsx.
 */
function isSafeUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}
