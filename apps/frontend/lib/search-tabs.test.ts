import { describe, expect, it } from 'vitest';
import { isSearchTab, resolveSearchTab, searchUrl } from '@/lib/search-tabs';

describe('isSearchTab', () => {
	it('accepts the known tabs', () => {
		expect(isSearchTab('posts')).toBe(true);
		expect(isSearchTab('users')).toBe(true);
	});

	it('rejects anything else', () => {
		expect(isSearchTab('media')).toBe(false);
		expect(isSearchTab(null)).toBe(false);
		expect(isSearchTab(undefined)).toBe(false);
	});
});

describe('resolveSearchTab', () => {
	it('falls back to posts for a hand-edited URL', () => {
		expect(resolveSearchTab('nonsense')).toBe('posts');
		expect(resolveSearchTab(undefined)).toBe('posts');
	});

	it('keeps a valid tab', () => {
		expect(resolveSearchTab('users')).toBe('users');
	});
});

describe('searchUrl', () => {
	it('omits the default tab', () => {
		expect(searchUrl('cats', 'posts')).toBe('/search?q=cats');
	});

	it('includes a non-default tab', () => {
		expect(searchUrl('cats', 'users')).toBe('/search?q=cats&type=users');
	});

	it('escapes the query', () => {
		expect(searchUrl('from:alice "a b"', 'posts')).toBe(
			'/search?q=from%3Aalice+%22a+b%22',
		);
	});
});
