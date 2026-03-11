import { describe, it, expect } from 'vitest';
import { parseTweetUrl, tweetToOgpData } from '@/lib/ogp/twitter';

// ---------------------------------------------------------------------------
// parseTweetUrl
// ---------------------------------------------------------------------------

describe('parseTweetUrl', () => {
	it('parses a standard x.com tweet URL', () => {
		const result = parseTweetUrl('https://x.com/jack/status/20');
		expect(result).toEqual({ screenName: 'jack', tweetId: '20' });
	});

	it('parses a twitter.com tweet URL', () => {
		const result = parseTweetUrl('https://twitter.com/BarackObama/status/266031293945503744');
		expect(result).toEqual({ screenName: 'BarackObama', tweetId: '266031293945503744' });
	});

	it('parses a mobile.twitter.com URL', () => {
		const result = parseTweetUrl('https://mobile.twitter.com/user/status/123456');
		expect(result).toEqual({ screenName: 'user', tweetId: '123456' });
	});

	it('parses a mobile.x.com URL', () => {
		const result = parseTweetUrl('https://mobile.x.com/user/status/789');
		expect(result).toEqual({ screenName: 'user', tweetId: '789' });
	});

	it('handles URL with query parameters', () => {
		const result = parseTweetUrl('https://x.com/user/status/123?s=20&t=abc');
		expect(result).toEqual({ screenName: 'user', tweetId: '123' });
	});

	it('handles URL with hash fragment', () => {
		const result = parseTweetUrl('https://x.com/user/status/123#replies');
		expect(result).toEqual({ screenName: 'user', tweetId: '123' });
	});

	it('handles http:// protocol', () => {
		const result = parseTweetUrl('http://x.com/user/status/123');
		expect(result).toEqual({ screenName: 'user', tweetId: '123' });
	});

	it('returns null for non-tweet x.com URLs', () => {
		expect(parseTweetUrl('https://x.com/jack')).toBeNull();
		expect(parseTweetUrl('https://x.com/jack/likes')).toBeNull();
		expect(parseTweetUrl('https://x.com/settings')).toBeNull();
	});

	it('returns null for non-Twitter URLs', () => {
		expect(parseTweetUrl('https://example.com/user/status/123')).toBeNull();
		expect(parseTweetUrl('https://google.com')).toBeNull();
	});

	it('returns null for fxtwitter/vxtwitter URLs', () => {
		expect(parseTweetUrl('https://fxtwitter.com/user/status/123')).toBeNull();
		expect(parseTweetUrl('https://vxtwitter.com/user/status/123')).toBeNull();
	});

	it('returns null for empty or invalid input', () => {
		expect(parseTweetUrl('')).toBeNull();
		expect(parseTweetUrl('not-a-url')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// tweetToOgpData
// ---------------------------------------------------------------------------

describe('tweetToOgpData', () => {
	it('converts a basic tweet to OgpData', () => {
		const result = tweetToOgpData(
			{
				text: 'just setting up my twttr',
				user: { name: 'jack', screen_name: 'jack' },
			},
			'https://x.com/jack/status/20',
		);

		expect(result).toEqual({
			title: 'jack (@jack)',
			description: 'just setting up my twttr',
			image: undefined,
			siteName: 'X (Twitter)',
			url: 'https://x.com/jack/status/20',
		});
	});

	it('uses photo URL as image when available', () => {
		const result = tweetToOgpData(
			{
				text: 'Four more years.',
				user: { name: 'Barack Obama', screen_name: 'BarackObama' },
				photos: [{ url: 'https://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg', width: 800, height: 532 }],
				mediaDetails: [{ type: 'photo', media_url_https: 'https://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg' }],
			},
			'https://twitter.com/BarackObama/status/266031293945503744',
		);

		expect(result.title).toBe('Barack Obama (@BarackObama)');
		expect(result.description).toBe('Four more years.');
		expect(result.image).toBe('https://pbs.twimg.com/media/A7EiDWcCYAAZT1D.jpg');
		expect(result.siteName).toBe('X (Twitter)');
	});

	it('falls back to mediaDetails when photos array is empty', () => {
		const result = tweetToOgpData(
			{
				text: 'Check this out',
				user: { name: 'Test User', screen_name: 'testuser' },
				photos: [],
				mediaDetails: [{ type: 'photo', media_url_https: 'https://pbs.twimg.com/media/fallback.jpg' }],
			},
			'https://x.com/testuser/status/999',
		);

		expect(result.image).toBe('https://pbs.twimg.com/media/fallback.jpg');
	});

	it('skips non-photo media in mediaDetails fallback', () => {
		const result = tweetToOgpData(
			{
				text: 'Video tweet',
				user: { name: 'Test', screen_name: 'test' },
				mediaDetails: [{ type: 'video', media_url_https: 'https://pbs.twimg.com/media/video_thumb.jpg' }],
			},
			'https://x.com/test/status/111',
		);

		expect(result.image).toBeUndefined();
	});

	it('handles missing user info gracefully', () => {
		const result = tweetToOgpData(
			{ text: 'orphan tweet' },
			'https://x.com/unknown/status/222',
		);

		expect(result.title).toBe('Unknown');
		expect(result.description).toBe('orphan tweet');
	});

	it('handles user with name but no screen_name', () => {
		const result = tweetToOgpData(
			{ text: 'hello', user: { name: 'Someone' } },
			'https://x.com/someone/status/333',
		);

		expect(result.title).toBe('Someone');
	});

	it('handles user with only screen_name', () => {
		const result = tweetToOgpData(
			{ text: 'hello', user: { screen_name: 'handle' } },
			'https://x.com/handle/status/444',
		);

		expect(result.title).toBe('handle (@handle)');
	});

	it('truncates long tweet text in description', () => {
		const longText = 'A'.repeat(350);
		const result = tweetToOgpData(
			{ text: longText, user: { name: 'X', screen_name: 'x' } },
			'https://x.com/x/status/555',
		);

		expect(result.description!.length).toBeLessThanOrEqual(300);
		expect(result.description!.endsWith('\u2026')).toBe(true);
	});

	it('truncates long display name in title', () => {
		const longName = 'B'.repeat(250);
		const result = tweetToOgpData(
			{ text: 'hi', user: { name: longName, screen_name: 'x' } },
			'https://x.com/x/status/666',
		);

		expect(result.title!.length).toBeLessThanOrEqual(200);
		expect(result.title!.endsWith('\u2026')).toBe(true);
	});

	it('handles empty text', () => {
		const result = tweetToOgpData(
			{ user: { name: 'Test', screen_name: 'test' } },
			'https://x.com/test/status/777',
		);

		expect(result.description).toBeUndefined();
	});
});
