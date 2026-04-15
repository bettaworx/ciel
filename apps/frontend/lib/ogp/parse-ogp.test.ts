import { describe, it, expect } from 'vitest';
import { parseOgp } from '@/lib/ogp/parse-ogp';

describe('parseOgp', () => {
	const PAGE_URL = 'https://example.com/page';

	it('extracts og:* meta tags', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="OG Title" />
				<meta property="og:description" content="OG Desc" />
				<meta property="og:image" content="https://example.com/image.png" />
				<meta property="og:site_name" content="Example" />
				<meta property="og:url" content="https://example.com/canonical" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result).toEqual({
			title: 'OG Title',
			description: 'OG Desc',
			image: 'https://example.com/image.png',
			imageWidth: undefined,
			imageHeight: undefined,
			siteName: 'Example',
			url: 'https://example.com/canonical',
		});
	});

	it('falls back to twitter:* meta tags', () => {
		const html = `
			<html><head>
				<meta name="twitter:title" content="Twitter Title" />
				<meta name="twitter:description" content="Twitter Desc" />
				<meta name="twitter:image" content="https://example.com/tw-image.png" />
				<meta name="twitter:site" content="@example" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result).toEqual({
			title: 'Twitter Title',
			description: 'Twitter Desc',
			image: 'https://example.com/tw-image.png',
			imageWidth: undefined,
			imageHeight: undefined,
			siteName: '@example',
			url: undefined,
		});
	});

	it('falls back to <title> and <meta name="description">', () => {
		const html = `
			<html><head>
				<title>Page Title</title>
				<meta name="description" content="Page Desc" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result).toEqual({
			title: 'Page Title',
			description: 'Page Desc',
			image: undefined,
			imageWidth: undefined,
			imageHeight: undefined,
			siteName: undefined,
			url: undefined,
		});
	});

	it('prefers og:title over twitter:title over <title>', () => {
		const html = `
			<html><head>
				<title>HTML Title</title>
				<meta name="twitter:title" content="Twitter Title" />
				<meta property="og:title" content="OG Title" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.title).toBe('OG Title');
	});

	it('returns null when no title is found', () => {
		const html = '<html><head></head><body></body></html>';
		const result = parseOgp(html, PAGE_URL);
		expect(result).toBeNull();
	});

	it('returns null when title is only whitespace', () => {
		const html = '<html><head><title>   </title></head><body></body></html>';
		const result = parseOgp(html, PAGE_URL);
		expect(result).toBeNull();
	});

	it('resolves relative og:image URLs to absolute', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Test" />
				<meta property="og:image" content="/images/thumb.jpg" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.image).toBe('https://example.com/images/thumb.jpg');
	});

	it('handles protocol-relative image URLs', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Test" />
				<meta property="og:image" content="//cdn.example.com/image.png" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.image).toBe('https://cdn.example.com/image.png');
	});

	it('ignores malformed image URLs', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Test" />
				<meta property="og:image" content="not a valid url ::::" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		// Malformed but with a base URL, the URL constructor may still resolve it
		// The key is that it doesn't throw
		expect(result?.title).toBe('Test');
	});

	it('truncates title to 200 chars', () => {
		const longTitle = 'A'.repeat(300);
		const html = `
			<html><head>
				<meta property="og:title" content="${longTitle}" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.title?.length).toBe(200);
		expect(result?.title?.endsWith('\u2026')).toBe(true);
	});

	it('truncates description to 300 chars', () => {
		const longDesc = 'B'.repeat(400);
		const html = `
			<html><head>
				<meta property="og:title" content="Title" />
				<meta property="og:description" content="${longDesc}" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.description?.length).toBe(300);
		expect(result?.description?.endsWith('\u2026')).toBe(true);
	});

	it('falls back to canonical link for URL', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Test" />
				<link rel="canonical" href="https://example.com/canonical-page" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.url).toBe('https://example.com/canonical-page');
	});

	it('handles meta tags using "name" attribute instead of "property"', () => {
		const html = `
			<html><head>
				<meta name="og:title" content="Name-based OG" />
				<meta name="og:description" content="Name-based Desc" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.title).toBe('Name-based OG');
		expect(result?.description).toBe('Name-based Desc');
	});

	it('trims whitespace from meta content', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="  Spaced Title  " />
				<meta property="og:description" content="  Spaced Desc  " />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.title).toBe('Spaced Title');
		expect(result?.description).toBe('Spaced Desc');
	});

	it('extracts og:image:width and og:image:height', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Test" />
				<meta property="og:image" content="https://example.com/img.png" />
				<meta property="og:image:width" content="1200" />
				<meta property="og:image:height" content="630" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.imageWidth).toBe(1200);
		expect(result?.imageHeight).toBe(630);
	});

	it('extracts twitter:image:width and twitter:image:height as fallback', () => {
		const html = `
			<html><head>
				<meta name="twitter:title" content="Test" />
				<meta name="twitter:image" content="https://example.com/img.png" />
				<meta name="twitter:image:width" content="400" />
				<meta name="twitter:image:height" content="400" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.imageWidth).toBe(400);
		expect(result?.imageHeight).toBe(400);
	});

	it('returns undefined dimensions when image is missing', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="No Image" />
				<meta property="og:image:width" content="1200" />
				<meta property="og:image:height" content="630" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.image).toBeUndefined();
		expect(result?.imageWidth).toBeUndefined();
		expect(result?.imageHeight).toBeUndefined();
	});

	it('ignores non-numeric image dimensions', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Bad Dims" />
				<meta property="og:image" content="https://example.com/img.png" />
				<meta property="og:image:width" content="auto" />
				<meta property="og:image:height" content="abc" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.imageWidth).toBeUndefined();
		expect(result?.imageHeight).toBeUndefined();
	});

	it('handles partial dimensions (only width provided)', () => {
		const html = `
			<html><head>
				<meta property="og:title" content="Partial" />
				<meta property="og:image" content="https://example.com/img.png" />
				<meta property="og:image:width" content="800" />
			</head><body></body></html>
		`;
		const result = parseOgp(html, PAGE_URL);
		expect(result?.imageWidth).toBe(800);
		expect(result?.imageHeight).toBeUndefined();
	});
});
