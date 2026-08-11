import { describe, expect, it } from 'vitest';
import {
	MAX_HISTORY_SUGGESTIONS,
	MAX_SEARCH_HISTORY,
	filterSearchHistory,
	isSearchHistory,
	pushSearchHistory,
} from '@/lib/search-history';

describe('pushSearchHistory', () => {
	it('puts the newest search first', () => {
		expect(pushSearchHistory(['older'], 'newer')).toEqual(['newer', 'older']);
	});

	it('promotes a repeated search instead of duplicating it', () => {
		expect(pushSearchHistory(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
	});

	it('trims the query before storing it', () => {
		expect(pushSearchHistory([], '  spaced  ')).toEqual(['spaced']);
	});

	it('ignores a blank query', () => {
		expect(pushSearchHistory(['a'], '   ')).toEqual(['a']);
	});

	it('caps the stored history', () => {
		const full = Array.from({ length: MAX_SEARCH_HISTORY }, (_, i) => `q${i}`);
		const result = pushSearchHistory(full, 'newest');

		expect(result).toHaveLength(MAX_SEARCH_HISTORY);
		expect(result[0]).toBe('newest');
		// The oldest entry is the one that falls off the end.
		expect(result).not.toContain(`q${MAX_SEARCH_HISTORY - 1}`);
	});

	it('does not mutate the input', () => {
		const history = ['a'];
		pushSearchHistory(history, 'b');
		expect(history).toEqual(['a']);
	});
});

describe('filterSearchHistory', () => {
	const history = ['cats', 'Cat food', 'dogs', 'catalogue', 'concat', 'birds'];

	it('offers the most recent entries when nothing is typed', () => {
		expect(filterSearchHistory(history, '')).toEqual([
			'cats',
			'Cat food',
			'dogs',
			'catalogue',
			'concat',
		]);
	});

	it('treats whitespace as nothing typed', () => {
		expect(filterSearchHistory(history, '   ')).toHaveLength(
			MAX_HISTORY_SUGGESTIONS,
		);
	});

	it('matches anywhere in the entry, ignoring case', () => {
		expect(filterSearchHistory(history, 'cat')).toEqual([
			'cats',
			'Cat food',
			'catalogue',
			'concat',
		]);
	});

	it('leaves out the entry equal to what was typed', () => {
		expect(filterSearchHistory(history, 'cats')).not.toContain('cats');
	});

	it('caps the suggestions', () => {
		const many = Array.from({ length: 12 }, (_, i) => `cat ${i}`);
		expect(filterSearchHistory(many, 'cat')).toHaveLength(
			MAX_HISTORY_SUGGESTIONS,
		);
	});

	it('returns nothing when there is no match', () => {
		expect(filterSearchHistory(history, 'zebra')).toEqual([]);
	});
});

describe('isSearchHistory', () => {
	it('accepts a list of strings', () => {
		expect(isSearchHistory([])).toBe(true);
		expect(isSearchHistory(['a', 'b'])).toBe(true);
	});

	it('rejects anything else', () => {
		expect(isSearchHistory(null)).toBe(false);
		expect(isSearchHistory('a')).toBe(false);
		expect(isSearchHistory(['a', 1])).toBe(false);
		expect(isSearchHistory({ 0: 'a' })).toBe(false);
	});
});
