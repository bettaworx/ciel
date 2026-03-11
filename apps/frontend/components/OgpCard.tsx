'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useOgp } from '@/lib/hooks/use-queries';
import { ExternalLink } from 'lucide-react';

/** Image width threshold (px). Images this width or smaller use compact layout. */
const COMPACT_THRESHOLD = 512;

interface OgpCardProps {
	url: string;
}

/**
 * Displays an Open Graph Protocol (OGP) link preview card.
 *
 * Two layout modes based on the OGP image width:
 *
 * **Large** (default / width > 512px or unknown):
 *   Image on top, text below — full-width display.
 *
 * **Compact** (width <= 512px):
 *   Square-cropped image on the left, text on the right — side-by-side.
 *
 * Design follows the project's flat design philosophy — no shadows, uses
 * border + rounded-xl consistent with the media cards in PostCard.
 */
export function OgpCard({ url }: OgpCardProps) {
	const { data: ogp, isLoading, isError } = useOgp(url);

	// --- Loading skeleton ---
	if (isLoading) {
		return (
			<div className="mb-3 rounded-xl border border-border overflow-hidden">
				<Skeleton className="h-40 w-full rounded-none" />
				<div className="p-3 space-y-2">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-1/3" />
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

	// Decide layout: compact when image width is known and <= threshold.
	const isCompact =
		imageProxyUrl != null &&
		ogp.imageWidth != null &&
		ogp.imageWidth <= COMPACT_THRESHOLD;

	if (isCompact) {
		return (
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="mb-3 flex rounded-xl border border-border overflow-hidden hover:bg-muted/50 transition-colors"
			>
				{/* Square-cropped thumbnail */}
				<div className="relative shrink-0 w-[108px] h-[108px] bg-muted">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={imageProxyUrl}
						alt={ogp.title ?? ''}
						className="w-full h-full object-cover"
						loading="lazy"
					/>
				</div>

				{/* Text content */}
				<div className="flex flex-col justify-center p-3 min-w-0">
					{ogp.title && (
						<p className="text-sm font-medium text-foreground line-clamp-2 break-words">
							{ogp.title}
						</p>
					)}

					{ogp.description && (
						<p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 break-words">
							{ogp.description}
						</p>
					)}

					<div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
						<ExternalLink size={12} className="shrink-0 opacity-60" />
						<span className="truncate">{ogp.siteName ?? displayUrl}</span>
					</div>
				</div>
			</a>
		);
	}

	// --- Large layout (default) ---
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
						className="w-full h-auto"
						loading="lazy"
					/>
				</div>
			)}

			{/* Text content */}
			<div className="p-3 min-w-0">
				{ogp.title && (
					<p className="text-sm font-medium text-foreground line-clamp-2 break-words">
						{ogp.title}
					</p>
				)}

				{ogp.description && (
					<p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-words">
						{ogp.description}
					</p>
				)}

				<div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
					<ExternalLink size={12} className="shrink-0 opacity-60" />
					<span className="truncate">{ogp.siteName ?? displayUrl}</span>
				</div>
			</div>
		</a>
	);
}
