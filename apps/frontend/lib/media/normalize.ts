/**
 * Client-side media normalization / sanitization.
 *
 * Every upload leaving the browser is forced into one of the shapes the backend
 * accepts, so the backend can stay strict:
 *
 *   still image (png/jpeg/webp/avif/heic/bmp/svg/...) -> WebP  (Canvas, native)
 *   video (mp4/mov/mkv/avi/webm/...)                  -> WebM  (mediabunny)
 *   animated GIF                                      -> passthrough
 *
 * GIF is passed through on purpose: browsers ship no animated-WebP encoder, and
 * the backend's ffmpeg already does that conversion with inter-frame prediction.
 *
 * Re-encoding doubles as sanitization: EXIF/GPS/ICC/XMP and anything smuggled
 * into the container is dropped, because only decoded pixels and samples survive.
 */

/**
 * How hard to compress, chosen per attachment by the poster.
 *
 * 'dot-by-dot' is for pixel art: it keeps the original dimensions and turns off
 * interpolation, because for that material not being resized matters far more
 * than the compression setting.
 *
 * 'none' uploads the file untouched. It is only worth offering for a file that
 * already satisfies the server, since nothing else would get past validation.
 */
export type ImageQualityMode =
	| 'none'
	| 'dot-by-dot'
	| 'performance'
	| 'balance'
	| 'quality';
export type VideoQualityMode = 'none' | 'performance' | 'balance' | 'quality';

export const DEFAULT_IMAGE_MODE: ImageQualityMode = 'balance';
export const DEFAULT_VIDEO_MODE: VideoQualityMode = 'balance';

/**
 * Longest edge in pixels, and WebP quality (0-1). A null edge means "leave the
 * dimensions alone".
 */
const IMAGE_MODES: Record<
	Exclude<ImageQualityMode, 'none'>,
	{ maxEdge: number | null; quality: number }
> = {
	// Chrome's canvas encoder goes lossless at quality 1; other browsers stay
	// lossy there, which is still visually exact.
	'dot-by-dot': { maxEdge: null, quality: 1 },
	performance: { maxEdge: 1280, quality: 0.65 },
	balance: { maxEdge: 2048, quality: 0.82 },
	quality: { maxEdge: 3072, quality: 0.95 },
};

/** Longest edge in pixels, and the bitrate ceiling as bits per pixel per frame. */
const VIDEO_MODES: Record<
	Exclude<VideoQualityMode, 'none'>,
	{ maxEdge: number; bitsPerPixel: number }
> = {
	performance: { maxEdge: 1280, bitsPerPixel: 0.07 },
	balance: { maxEdge: 1920, bitsPerPixel: 0.1 },
	quality: { maxEdge: 1920, bitsPerPixel: 0.15 },
};

/** Audio bitrate of a normalized video, in bits per second. */
const AUDIO_BITRATE = 96_000;
/**
 * Fraction of the size budget the video is allowed to target. The rest absorbs
 * container overhead and VBR overshoot.
 */
const SIZE_BUDGET_HEADROOM = 0.9;
/**
 * Frame rate the bitrate ceiling is reckoned against. The source frame rate is
 * preserved, so a 60fps clip gets the same ceiling spread over twice the frames.
 *
 * ponytail: fixed assumption; read the real frame rate off the track if
 * high-frame-rate uploads ever look starved.
 */
const ASSUMED_FPS = 30;
/** Below this, the result is not worth watching; reject instead of encoding mush. */
const MIN_VIDEO_BITRATE = 250_000;
/**
 * Ceilings the server enforces. Passed in rather than restated here, so a change
 * to the server's configuration reaches the converter instead of being silently
 * contradicted by a second copy of the same numbers.
 */
export type ServerMediaLimits = {
	maxWidth: number;
	maxHeight: number;
	maxPixels: number;
	maxFrameRate: number;
};

/** Used only until /server/config answers; see lib/media/requirements.ts. */
const FALLBACK_LIMITS: ServerMediaLimits = {
	maxWidth: 16384,
	maxHeight: 16384,
	maxPixels: 50_000_000,
	maxFrameRate: 60,
};

export type NormalizeErrorCode =
	| 'unsupported_image'
	| 'image_too_large'
	| 'webp_unsupported'
	| 'no_video_track'
	| 'video_too_large'
	| 'video_unsupported';

export type NormalizeOptions = {
	/** What the server will accept. Defaults to the shipped configuration. */
	limits?: ServerMediaLimits;
	/** How hard to compress a still image. Defaults to 'balance'. */
	imageMode?: ImageQualityMode;
	/** How hard to compress a video. Defaults to 'balance'. */
	videoMode?: VideoQualityMode;
	/**
	 * Size budget for the output, in bytes. Video is encoded at a bitrate that
	 * fits it, so a long clip comes out watchable-but-smaller instead of being
	 * transcoded in full and then rejected as too large.
	 */
	maxBytes?: number;
	/** 0-1 progress. Only reported for video conversion, where it is slow enough to matter. */
	onProgress?: (progress: number) => void;
	/** Aborting stops an in-flight video conversion instead of letting it burn CPU. */
	signal?: AbortSignal;
};

/**
 * Marks a file this module produced, so the upload path does not convert it a
 * second time. Video is normalized when it is attached to the composer and then
 * passes through requestForm() again on submit.
 *
 * The mark lives on the file rather than in a module-scoped WeakSet: the
 * composer imports this module statically while the upload path imports it
 * dynamically, and a bundler is free to give those two separate instances. It
 * does — measured — and a WeakSet then misses, doubling every video conversion.
 */
const NORMALIZED_MARK = '__cielNormalized';

function isMarkedNormalized(file: File): boolean {
	return NORMALIZED_MARK in file;
}

function markNormalized(file: File): File {
	Object.defineProperty(file, NORMALIZED_MARK, { value: true });
	return file;
}

export class MediaNormalizeError extends Error {
	readonly code: NormalizeErrorCode;

	constructor(code: NormalizeErrorCode, cause?: unknown) {
		super(`media normalization failed: ${code}`, { cause });
		this.name = 'MediaNormalizeError';
		this.code = code;
	}
}

const VIDEO_EXT = /\.(mp4|m4v|mov|webm|mkv|avi|3gp|ogv|ogg|ts|flv|wmv)$/i;

export function isVideoFile(file: File): boolean {
	return file.type.startsWith('video/') || (!file.type && VIDEO_EXT.test(file.name));
}

export function isGifFile(file: File): boolean {
	return file.type === 'image/gif' || (!file.type && /\.gif$/i.test(file.name));
}

/** Scale (width, height) down so the longest edge is at most maxEdge, preserving aspect ratio. */
export function fitWithin(
	width: number,
	height: number,
	maxEdge: number,
): { width: number; height: number } {
	const longest = Math.max(width, height);
	if (longest <= maxEdge) return { width, height };
	const scale = maxEdge / longest;
	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

/**
 * Video bitrate, in bits per second, as the tightest of three limits:
 *
 *   ceiling — more bits than this stop being visible
 *   budget  — what the caller's size limit leaves for this duration
 *   source  — what the input actually spent; encoding above it only inflates
 *             the file, and the output is downscaled on top of that
 *
 * Returns null when even the budget cannot buy a watchable bitrate, i.e. the
 * video is too long to fit at all. The source limit never triggers that: a clip
 * that was already tiny is fine to keep tiny.
 */
export function pickVideoBitrate(input: {
	fileSize: number;
	durationSec: number;
	width: number;
	height: number;
	bitsPerPixel: number;
	maxBytes?: number;
}): number | null {
	const { fileSize, durationSec, width, height, bitsPerPixel, maxBytes } = input;

	const ceiling = bitsPerPixel * width * height * ASSUMED_FPS;

	const budget =
		maxBytes && durationSec > 0
			? (maxBytes * 8 * SIZE_BUDGET_HEADROOM) / durationSec - AUDIO_BITRATE
			: Infinity;
	if (budget < MIN_VIDEO_BITRATE) return null;

	const source =
		durationSec > 0 ? (fileSize * 8) / durationSec - AUDIO_BITRATE : Infinity;

	return Math.round(Math.min(ceiling, budget, Math.max(source, MIN_VIDEO_BITRATE)));
}

/** Swap a filename's extension, e.g. ("cat.HEIC", "webp") -> "cat.webp". */
export function replaceExt(filename: string, ext: string): string {
	const base = filename.replace(/\.[^.]*$/, '') || 'media';
	return `${base}.${ext}`;
}

/**
 * Normalize a file for upload. Returns the original file unchanged when no
 * conversion applies (animated GIF).
 */
export async function normalizeForUpload(
	file: File,
	opts: NormalizeOptions = {},
): Promise<File> {
	if (isMarkedNormalized(file)) return file;

	const isVideo = isVideoFile(file);
	const mode = isVideo
		? (opts.videoMode ?? DEFAULT_VIDEO_MODE)
		: (opts.imageMode ?? DEFAULT_IMAGE_MODE);

	// GIF has no browser encoder, and 'none' is the poster saying the file is
	// already in shape. Either way it goes up as it is.
	if (mode === 'none' || isGifFile(file)) return markNormalized(file);

	const limits = opts.limits ?? FALLBACK_LIMITS;
	const result = isVideo
		? await normalizeVideo(file, mode as Exclude<VideoQualityMode, 'none'>, opts, limits)
		: await normalizeImage(file, mode as Exclude<ImageQualityMode, 'none'>, limits);

	return markNormalized(result);
}

async function normalizeImage(
	file: File,
	modeName: Exclude<ImageQualityMode, 'none'>,
	limits: ServerMediaLimits,
): Promise<File> {
	let bitmap: ImageBitmap;
	try {
		// `from-image` bakes EXIF orientation into the pixels; the stripped output
		// carries no orientation tag, so this has to happen here.
		bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	} catch (cause) {
		throw new MediaNormalizeError('unsupported_image', cause);
	}

	try {
		if (bitmap.width * bitmap.height > limits.maxPixels) {
			throw new MediaNormalizeError('image_too_large');
		}

		const mode = IMAGE_MODES[modeName];
		// Dot-by-dot asks for no resizing, but the server's ceiling still applies:
		// its limit is what it accepts, not a matter of taste.
		const serverEdge = Math.min(limits.maxWidth, limits.maxHeight);
		const maxEdge = Math.min(mode.maxEdge ?? serverEdge, serverEdge);
		const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge);

		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new MediaNormalizeError('webp_unsupported');
		// Interpolation is what turns pixel art to mush, so dot-by-dot turns it off.
		// At its original size this is a straight copy either way, but the flag also
		// covers the case where a browser still scales for device pixel ratio.
		ctx.imageSmoothingEnabled = mode.maxEdge !== null;
		ctx.drawImage(bitmap, 0, 0, width, height);

		const blob = await canvas.convertToBlob({ type: 'image/webp', quality: mode.quality });
		// Browsers without a WebP encoder silently fall back to PNG.
		if (blob.type !== 'image/webp') throw new MediaNormalizeError('webp_unsupported');

		return new File([blob], replaceExt(file.name, 'webp'), { type: 'image/webp' });
	} finally {
		bitmap.close();
	}
}

async function normalizeVideo(
	file: File,
	modeName: Exclude<VideoQualityMode, 'none'>,
	opts: NormalizeOptions,
	limits: ServerMediaLimits,
): Promise<File> {
	const {
		ALL_FORMATS,
		BlobSource,
		BufferTarget,
		Conversion,
		Input,
		Mp4OutputFormat,
		Output,
		Quality,
		WebMOutputFormat,
		getFirstEncodableVideoCodec,
	} = await import('mediabunny');

	const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });

	const track = await input.getPrimaryVideoTrack();
	if (!track) throw new MediaNormalizeError('no_video_track');

	const mode = VIDEO_MODES[modeName];
	const { width, height } = fitWithin(
		await track.getDisplayWidth(),
		await track.getDisplayHeight(),
		Math.min(mode.maxEdge, limits.maxWidth, limits.maxHeight),
	);

	// The source frame rate is kept, except where it would put the result over
	// what the server accepts — better a 60fps upload than a 240fps one rejected
	// after minutes of encoding.
	const { averagePacketRate } = await track.computePacketStats(100);
	const frameRate =
		averagePacketRate > limits.maxFrameRate ? limits.maxFrameRate : undefined;

	const videoBitrate = pickVideoBitrate({
		fileSize: file.size,
		durationSec: await input.computeDuration(),
		width,
		height,
		bitsPerPixel: mode.bitsPerPixel,
		maxBytes: opts.maxBytes,
	});
	if (videoBitrate === null) throw new MediaNormalizeError('video_too_large');

	// WebM is the target. Safari exposes no VP8/VP9/AV1 *encoder*, so fall back to
	// MP4/H.264 there rather than locking those users out of uploading video.
	const webm = new WebMOutputFormat();
	const videoCodec = await getFirstEncodableVideoCodec(webm.getSupportedVideoCodecs(), {
		width,
		height,
	});
	const output = new Output({
		format: videoCodec ? webm : new Mp4OutputFormat({ fastStart: 'in-memory' }),
		target: new BufferTarget(),
	});

	const conversion = await Conversion.init({
		input,
		output,
		tracks: 'primary',
		// Only the longest edge is constrained; mediabunny derives the other from the
		// aspect ratio, so no letterboxing is introduced.
		video: {
			...(width >= height ? { width } : { height }),
			...(videoCodec ? { codec: videoCodec } : {}),
			...(frameRate ? { frameRate } : {}),
			// Constant rate: variable overshot the target by ~2x on real footage,
			// and here a predictable size matters more than constant quality.
			quality: new Quality({ bitrate: videoBitrate, bitrateMode: 'constant' }),
		},
		audio: { quality: new Quality({ bitrate: AUDIO_BITRATE }) },
	});
	if (!conversion.isValid) throw new MediaNormalizeError('video_unsupported');
	if (opts.onProgress) conversion.onProgress = opts.onProgress;

	// Cancelling releases the encoder immediately; without it, removing a video
	// mid-conversion would leave a long transcode running in the background.
	const onAbort = () => void conversion.cancel();
	opts.signal?.addEventListener('abort', onAbort, { once: true });

	try {
		// Aborting during Input parsing or Conversion.init lands before the listener
		// above exists, so re-check rather than transcoding a discarded video.
		opts.signal?.throwIfAborted();
		await conversion.execute();
	} catch (cause) {
		// A cancellation is the caller's own doing, not a broken file.
		opts.signal?.throwIfAborted();
		throw new MediaNormalizeError('video_unsupported', cause);
	} finally {
		opts.signal?.removeEventListener('abort', onAbort);
	}

	const buffer = output.target.buffer;
	if (!buffer) throw new MediaNormalizeError('video_unsupported');

	const ext = videoCodec ? 'webm' : 'mp4';
	return new File([buffer], replaceExt(file.name, ext), {
		type: videoCodec ? 'video/webm' : 'video/mp4',
	});
}
