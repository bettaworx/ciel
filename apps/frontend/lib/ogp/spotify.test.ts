import { describe, it, expect } from 'vitest';
import { parseSpotifyUrl, getSpotifyEmbedUrl } from '@/lib/ogp/spotify';

describe('parseSpotifyUrl', () => {
	it('parses a track URL', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl')).toEqual({
			type: 'track',
			id: '11dFghVXANMlKmJXsNCbNl',
		});
	});

	it('parses an album URL', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/album/2noRn2Aes5aoNVsU6iWThc')).toEqual({
			type: 'album',
			id: '2noRn2Aes5aoNVsU6iWThc',
		});
	});

	it('parses a playlist URL', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toEqual({
			type: 'playlist',
			id: '37i9dQZF1DXcBWIGoYBM5M',
		});
	});

	it('parses an artist URL', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/artist/0TnOYISbd1XYRBk9myaseg')).toEqual({
			type: 'artist',
			id: '0TnOYISbd1XYRBk9myaseg',
		});
	});

	it('parses an episode URL', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ')).toEqual({
			type: 'episode',
			id: '512ojhOuo1ktJprKbVcKyQ',
		});
	});

	it('parses a show URL', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ')).toEqual({
			type: 'show',
			id: '38bS44xjbVVZ3No3ByF1dJ',
		});
	});

	it('parses an intl-ja locale URL', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/intl-ja/track/11dFghVXANMlKmJXsNCbNl')).toEqual({
			type: 'track',
			id: '11dFghVXANMlKmJXsNCbNl',
		});
	});

	it('parses a URL with www. subdomain', () => {
		expect(parseSpotifyUrl('https://www.open.spotify.com/track/abc123')).toEqual({
			type: 'track',
			id: 'abc123',
		});
	});

	it('parses a URL with http:// protocol', () => {
		expect(parseSpotifyUrl('http://open.spotify.com/track/abc123')).toEqual({
			type: 'track',
			id: 'abc123',
		});
	});

	it('ignores query parameters', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/track/abc123?si=xyz')).toEqual({
			type: 'track',
			id: 'abc123',
		});
	});

	it('ignores hash fragments', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/track/abc123#something')).toEqual({
			type: 'track',
			id: 'abc123',
		});
	});

	it('returns null for unsupported type', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/user/johndoe')).toBeNull();
	});

	it('returns null for root path', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/')).toBeNull();
	});

	it('returns null for non-Spotify domain', () => {
		expect(parseSpotifyUrl('https://example.com/track/abc123')).toBeNull();
	});

	it('returns null for ID with special characters', () => {
		expect(parseSpotifyUrl('https://open.spotify.com/track/abc-123')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(parseSpotifyUrl('')).toBeNull();
	});
});

describe('getSpotifyEmbedUrl', () => {
	it('returns the correct embed URL', () => {
		expect(getSpotifyEmbedUrl({ type: 'track', id: '11dFghVXANMlKmJXsNCbNl' })).toBe(
			'https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl?utm_source=generator',
		);
	});
});
