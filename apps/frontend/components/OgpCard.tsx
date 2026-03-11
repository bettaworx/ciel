'use client';

import { useOgp } from '@/lib/hooks/use-queries';
import { ExternalLink } from 'lucide-react';

interface OgpCardProps {
	url: string;
}

/**
 * Displays an Open Graph Protocol (OGP) link preview card.
 *
 * Layout: large image on top (Twitter/X-style) with title, description,
 * and site name below.  Falls back gracefully when the OGP image is missing.
 *
 * Design follows the project's flat design philosophy — no shadows, uses
 * border + rounded-xl consistent with the media cards in PostCard.
 */
export function OgpCard({ url }: OgpCardProps) {
	const { data: ogp, isLoading, isError } = useOgp(url);

	// --- Loading skeleton ---
	if (isLoading) {
		return (
			<div className="mb-3 rounded-xl border border-border overflow-hidden animate-pulse">
				<div className="bg-muted h-40" />
				<div className="p-3 space-y-2">
					<div className="bg-muted h-4 w-3/4 rounded" />
					<div className="bg-muted h-3 w-full rounded" />
					<div className="bg-muted h-3 w-1/3 rounded" />
				</div>
			</div>
		);
	}

	// --- Error or no data: render nothing ---
	if (isError || !ogp) return null;

	const displayUrl = (() => {
		try {
			return new URL(ogp.url ?? url).hostname;
		} catch {
			return ogp.siteName ?? url;
		}
	})();

	const imageProxyUrl = ogp.image
		? `/api/ogp/image?url=${encodeURIComponent(ogp.image)}`
		: null;

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="mb-3 block rounded-xl border border-border overflow-hidden hover:bg-muted/50 transition-colors"
		>
			{/* OGP Image */}
			{imageProxyUrl && (
				<div className="relative w-full bg-muted">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={imageProxyUrl}
						alt={ogp.title ?? ''}
						className="w-full h-auto max-h-64 object-cover"
						loading="lazy"
					/>
				</div>
			)}

			{/* Text content */}
			<div className="p-3 min-w-0">
				{/* Title */}
				{ogp.title && (
					<p className="text-sm font-medium text-foreground line-clamp-2 break-words">
						{ogp.title}
					</p>
				)}

				{/* Description */}
				{ogp.description && (
					<p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-words">
						{ogp.description}
					</p>
				)}

				{/* Site info */}
				<div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
					<ExternalLink size={12} className="shrink-0 opacity-60" />
					<span className="truncate">{ogp.siteName ?? displayUrl}</span>
				</div>
			</div>
		</a>
	);
}
