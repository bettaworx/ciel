/**
 * OGP (Open Graph Protocol) data extracted from a URL's HTML meta tags.
 */
export interface OgpData {
	/** Page title (og:title > twitter:title > <title>) */
	title?: string;
	/** Page description (og:description > twitter:description > <meta name="description">) */
	description?: string;
	/** Thumbnail image URL (og:image > twitter:image) */
	image?: string;
	/** Image width in pixels (og:image:width) */
	imageWidth?: number;
	/** Image height in pixels (og:image:height) */
	imageHeight?: number;
	/** Site name (og:site_name) */
	siteName?: string;
	/** Canonical URL (og:url > canonical link) */
	url?: string;
}

/**
 * Response shape from the /api/ogp endpoint.
 */
export interface OgpApiResponse {
	data?: OgpData;
	error?: string;
}
