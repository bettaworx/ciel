export type SpotifyEmbedType = 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'show';

/**
 * Pattern matching open.spotify.com content URLs:
 *   - https://open.spotify.com/<type>/<id>
 *   - https://open.spotify.com/intl-<locale>/<type>/<id>
 *
 * Captures: [1] = type, [2] = id
 */
const SPOTIFY_URL_RE =
	/^https?:\/\/(?:www\.)?open\.spotify\.com\/(?:intl-[a-z]{2,5}\/)?([a-z]+)\/([A-Za-z0-9]+)(?=[?#]|$)/i;

const ALLOWED_TYPES = new Set<string>([
	'track', 'album', 'playlist', 'artist', 'episode', 'show',
]);

/**
 * If the URL points to a supported Spotify content page, returns `{ type, id }`.
 * Otherwise returns `null`.
 */
export function parseSpotifyUrl(url: string): { type: SpotifyEmbedType; id: string } | null {
	const m = SPOTIFY_URL_RE.exec(url);
	if (!m) return null;
	const type = m[1].toLowerCase();
	if (!ALLOWED_TYPES.has(type)) return null;
	return { type: type as SpotifyEmbedType, id: m[2] };
}

/**
 * Returns the Spotify iframe embed URL for a given type and id.
 */
export function getSpotifyEmbedUrl({ type, id }: { type: SpotifyEmbedType; id: string }): string {
	return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
}
