import type { Connect, Plugin, ViteDevServer, PreviewServer } from "vite";

/**
 * Dev/preview stand-in for the production web server.
 *
 * In production nginx generates /runtime-config.json from the container's
 * environment and sets the CSP header. Both servers here do the same from the
 * same variables, so `pnpm dev` and `vite preview` resolve the API the way a
 * deployment does.
 */

const RUNTIME_CONFIG_PATH = "/runtime-config.json";
const DEFAULT_API_BASE_URL = "http://localhost:6137";

function runtimeConfigBody(): string {
  const apiBaseUrl = (process.env.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  return JSON.stringify({ apiBaseUrl });
}

function origin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

function websocketOrigin(value: string | undefined): string | null {
  const httpOrigin = origin(value);
  if (!httpOrigin) return null;
  return httpOrigin.replace(/^http/, "ws");
}

/**
 * The same directives the production nginx config carries, kept in sync by
 * hand. Report-Only here, because Vite injects inline scripts for HMR and a
 * blocking policy in dev would only teach us to ignore it.
 */
function cspHeaderValue(): string {
  const backendOrigins = [origin(process.env.API_BASE_URL) ?? DEFAULT_API_BASE_URL];
  const publicOrigin = origin(process.env.PUBLIC_BASE_URL);
  if (publicOrigin) backendOrigins.push(publicOrigin);

  const socketOrigins = [websocketOrigin(process.env.API_BASE_URL) ?? "ws://localhost:6137"];
  const backends = [...new Set(backendOrigins)].join(" ");
  const sockets = [...new Set(socketOrigins)].join(" ");

  // Third-party sources specific features need:
  //   cdn.jsdelivr.net          - Twemoji sprite sheets
  //   open.spotify.com          - Spotify embeds in link previews
  //   youtube-nocookie.com      - YouTube embeds in link previews
  //   platform.x.com            - X (Twitter) embed script
  //   platform.twitter.com      - X (Twitter) embed script (legacy)
  //   syndication.twitter.com   - X (Twitter) embed data / iframe
  //   cdn.syndication.twimg.com - X (Twitter) embed data
  //   pbs.twimg.com             - X (Twitter) profile / media images
  //   abs.twimg.com             - X (Twitter) assets
  //   video.twimg.com           - X (Twitter) videos
  const SPOTIFY = "https://open.spotify.com";
  const YOUTUBE = "https://www.youtube-nocookie.com";
  const TWITTER_SCRIPT =
    "https://platform.x.com https://platform.twitter.com https://syndication.twitter.com";
  const TWITTER_CONNECT = "https://cdn.syndication.twimg.com https://syndication.twitter.com";
  const TWITTER_IMG =
    "https://pbs.twimg.com https://abs.twimg.com https://cdn.syndication.twimg.com";
  const TWITTER_MEDIA = "https://video.twimg.com";
  const TWITTER_FRAME = "https://platform.twitter.com https://syndication.twitter.com";

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${TWITTER_SCRIPT}`,
    "style-src 'self' 'unsafe-inline'",
    // cdn.jsdelivr.net serves Twemoji sprites.
    `img-src 'self' data: blob: https://cdn.jsdelivr.net ${TWITTER_IMG} ${backends}`,
    "font-src 'self' data:",
    `connect-src 'self' ${SPOTIFY} ${YOUTUBE} ${TWITTER_CONNECT} ${backends} ${sockets}`,
    `media-src 'self' blob: ${TWITTER_MEDIA} ${backends}`,
    "object-src 'none'",
    `frame-src 'self' ${SPOTIFY} ${YOUTUBE} ${TWITTER_FRAME}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const middleware: Connect.NextHandleFunction = (req, res, next) => {
  if (req.url?.split("?")[0] === RUNTIME_CONFIG_PATH) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(runtimeConfigBody());
    return;
  }

  res.setHeader("Content-Security-Policy-Report-Only", cspHeaderValue());
  next();
};

export function cielRuntimePlugin(): Plugin {
  return {
    name: "ciel-runtime-config",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(middleware);
    },
  };
}

/**
 * Drop the legacy .woff fallbacks the @fontsource stylesheets carry.
 *
 * Every browser this app can run in at all — it needs WebAssembly, IndexedDB
 * and WebCrypto — has supported woff2 for years, so shipping both formats
 * doubles the font payload in the image for nothing (39 MB of the 70 MB build
 * before this).
 */
export function dropLegacyWoffPlugin(): Plugin {
  // Matches the fallback entry in `src: url(x.woff2) format("woff2"),
  // url(x.woff) format("woff")`, minified or not.
  const woffSource = /,\s*url\([^)]*\.woff\)\s*format\(\s*["']woff["']\s*\)/g;

  return {
    name: "ciel-drop-legacy-woff",
    apply: "build",
    generateBundle(_options, bundle) {
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (fileName.endsWith(".woff")) {
          delete bundle[fileName];
          continue;
        }
        if (
          fileName.endsWith(".css") &&
          asset.type === "asset" &&
          typeof asset.source === "string"
        ) {
          asset.source = asset.source.replace(woffSource, "");
        }
      }
    },
  };
}
