import { describe, it, expect } from 'vitest';
import { extractFirstUrl } from '@/lib/ogp/extract-url';

describe('extractFirstUrl', () => {
	it('extracts a bare URL', () => {
		const result = extractFirstUrl('Check out https://example.com for more info');
		expect(result).toBe('https://example.com');
	});

	it('extracts the first URL when multiple exist', () => {
		const result = extractFirstUrl(
			'Visit https://first.com and https://second.com',
		);
		expect(result).toBe('https://first.com');
	});

	it('extracts URL from a labelled link', () => {
		const result = extractFirstUrl('[click here](https://example.com/page)');
		expect(result).toBe('https://example.com/page');
	});

	it('returns null for empty content', () => {
		expect(extractFirstUrl('')).toBeNull();
	});

	it('returns null when no URL is found', () => {
		expect(extractFirstUrl('Just some plain text without links')).toBeNull();
	});

	it('rejects non-http URLs', () => {
		// mfm-js may or may not parse javascript: as a URL, but isSafeUrl should reject it
		expect(extractFirstUrl('javascript:alert(1)')).toBeNull();
	});

	it('extracts URL from within bold text', () => {
		const result = extractFirstUrl('**https://example.com** is important');
		expect(result).toBe('https://example.com');
	});

	it('handles http:// URLs', () => {
		const result = extractFirstUrl('Visit http://example.com');
		expect(result).toBe('http://example.com');
	});

	it('handles URLs with paths and query strings', () => {
		const result = extractFirstUrl(
			'Check https://example.com/path?query=value&other=1#hash',
		);
		expect(result).toBe('https://example.com/path?query=value&other=1#hash');
	});

	it('returns null for null-ish input', () => {
		expect(extractFirstUrl(null as unknown as string)).toBeNull();
		expect(extractFirstUrl(undefined as unknown as string)).toBeNull();
	});
});
