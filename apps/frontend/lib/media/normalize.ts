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

/** Longest edge of a normalized still image, in pixels. */
const IMAGE_MAX_EDGE = 2048;
/** WebP quality for still images (0-1). 0.82 is the knee of the size/quality curve. */
const IMAGE_QUALITY = 0.82;
/** Longest edge of a normalized video, in pixels. */
const VIDEO_MAX_EDGE = 1920;
/** Audio bitrate of a normalized video, in bits per second. */
const AUDIO_BITRATE = 96_000;
/**
 * Fraction of the size budget the video is allowed to target. The rest absorbs
 * container overhead and VBR overshoot.
 */
const SIZE_BUDGET_HEADROOM = 0.9;
/**
 * Upper bound on video bitrate, as bits per pixel per frame at an assumed 30fps.
 * 0.1 bpp is ~6 Mbps at 1080p — roughly "medium" quality, and the point past
 * which more bits stop being visible for typical social video.
 *
 * ponytail: fixed 30fps assumption; read the real frame rate off the track if
 * high-frame-rate uploads ever look starved.
 */
const BITS_PER_PIXEL = 0.1;
const ASSUMED_FPS = 30;
/** Below this, the result is not worth watching; reject instead of encoding mush. */
const MIN_VIDEO_BITRATE = 250_000;
/** A decoded image larger than this is a decompression bomb, not a photo. */
const IMAGE_MAX_PIXELS = 100_000_000;

export type NormalizeErrorCode =
	| 'unsupported_image'
	| 'image_too_large'
	| 'webp_unsupported'
	| 'no_video_track'
	| 'video_too_large'
	| 'video_unsupported';

export type NormalizeOptions = {
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
 * Files this module produced. Video is converted when it is attached to the
 * composer and then passes through the upload path again, so without this the
 * WebM would be re-encoded a second time. Registering outputs rather than
 * flagging call sites means no caller can forget.
 */
const alreadyNormalized = new WeakSet<File>();

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
	if (alreadyNormalized.has(file)) return file;

	const result = isGifFile(file)
		? file
		: isVideoFile(file)
			? await normalizeVideo(file, opts)
			: await normalizeImage(file);

	alreadyNormalized.add(result);
	return result;
}

async function normalizeImage(file: File): Promise<File> {
	let bitmap: ImageBitmap;
	try {
		// `from-image` bakes EXIF orientation into the pixels; the stripped output
		// carries no orientation tag, so this has to happen here.
		bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	} catch (cause) {
		throw new MediaNormalizeError('unsupported_image', cause);
	}

	try {
		if (bitmap.width * bitmap.height > IMAGE_MAX_PIXELS) {
			throw new MediaNormalizeError('image_too_large');
		}

		const { width, height } = fitWithin(
			bitmap.width,
			bitmap.height,
			IMAGE_MAX_EDGE,
		);
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new MediaNormalizeError('webp_unsupported');
		ctx.drawImage(bitmap, 0, 0, width, height);

		const blob = await canvas.convertToBlob({ type: 'image/webp', quality: IMAGE_QUALITY });
		// Browsers without a WebP encoder silently fall back to PNG.
		if (blob.type !== 'image/webp') throw new MediaNormalizeError('webp_unsupported');

		return new File([blob], replaceExt(file.name, 'webp'), { type: 'image/webp' });
	} finally {
		bitmap.close();
	}
}

async function normalizeVideo(file: File, opts: NormalizeOptions): Promise<File> {
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

	const { width, height } = fitWithin(
		await track.getDisplayWidth(),
		await track.getDisplayHeight(),
		VIDEO_MAX_EDGE,
	);

	// Pick the bitrate from whichever binds first: the quality ceiling, or the
	// share of the caller's size budget this video's duration leaves per second.
	const ceiling = BITS_PER_PIXEL * width * height * ASSUMED_FPS;
	const duration = await input.computeDuration();
	const budget =
		opts.maxBytes && duration > 0
			? (opts.maxBytes * 8 * SIZE_BUDGET_HEADROOM) / duration - AUDIO_BITRATE
			: Infinity;
	const videoBitrate = Math.min(ceiling, budget);
	if (videoBitrate < MIN_VIDEO_BITRATE) throw new MediaNormalizeError('video_too_large');

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
			quality: new Quality({ bitrate: Math.round(videoBitrate), bitrateMode: 'variable' }),
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
