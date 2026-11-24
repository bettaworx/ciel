export type YoutubeVideoId = string;

/**
 * Normalized host names we treat as YouTube.
 */
const YOUTUBE_HOSTS = new Set<string>([
  "youtube.com",
  "youtu.be",
  "music.youtube.com",
  "youtube-nocookie.com",
]);

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function isYoutubeHost(hostname: string): boolean {
  const normalized = hostname.replace(/^(www|m)\./, "").toLowerCase();
  return YOUTUBE_HOSTS.has(normalized);
}

/**
 * If the URL points to a supported YouTube video page, returns `{ videoId }`.
 * Otherwise returns `null`.
 *
 * Supported URL formats:
 *   - https://www.youtube.com/watch?v=VIDEO_ID
 *   - https://youtu.be/VIDEO_ID
 *   - https://www.youtube.com/embed/VIDEO_ID
 *   - https://www.youtube.com/shorts/VIDEO_ID
 *   - https://www.youtube.com/live/VIDEO_ID
 *   - https://music.youtube.com/watch?v=VIDEO_ID
 *   - https://www.youtube-nocookie.com/embed/VIDEO_ID
 */
export function parseYoutubeUrl(url: string): { videoId: YoutubeVideoId } | null {
  try {
    const parsed = new URL(url);
    if (!isYoutubeHost(parsed.hostname)) return null;

    // youtu.be/VIDEO_ID
    if (parsed.hostname.replace(/^www\./, "").toLowerCase() === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      if (id && VIDEO_ID_RE.test(id)) return { videoId: id };
      return null;
    }

    // /watch, /watch?v=ID, music.youtube.com/watch?v=ID
    if (parsed.pathname === "/watch") {
      const v = parsed.searchParams.get("v");
      if (v && VIDEO_ID_RE.test(v)) return { videoId: v };
      return null;
    }

    // /embed/ID, /shorts/ID, /live/ID (including youtube-nocookie.com)
    const pathMatch = /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/.exec(parsed.pathname);
    if (pathMatch) {
      return { videoId: pathMatch[1] };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns the YouTube iframe embed URL for a given video ID.
 */
export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
