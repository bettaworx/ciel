import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/config.ts");

// API_BASE_URL: internal backend URL used by the Next.js server for SSR fetches.
// PUBLIC_BASE_URL: public-facing URL (nginx address) used by the browser to load media.
// Both are needed as remote patterns — the server fetches originals via the internal URL,
// while media hrefs in API responses point to the public URL.
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:6137";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || apiBaseUrl;
const apiUrl = new URL(apiBaseUrl);
const publicUrl = new URL(publicBaseUrl);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",

  // Inject build version info (defaults to "dev" for local development)
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: process.env.BUILD_COMMIT || "dev",
    NEXT_PUBLIC_BUILD_BRANCH: process.env.BUILD_BRANCH || "dev",
    NEXT_PUBLIC_BUILD_VERSION: process.env.npm_package_version || "0.1.0",
  },

  // Allow dev HMR requests from other origins (e.g. Tailscale IPs, LAN access).
  // Set NEXT_DEV_ORIGINS as a comma-separated list in .env to add origins.
  allowedDevOrigins: process.env.NEXT_DEV_ORIGINS
    ? process.env.NEXT_DEV_ORIGINS.split(",").map((s) => s.trim())
    : [],

  // Packages that must not be bundled – they need to run as native Node.js
  // modules in API routes (e.g. undici uses native net/tls bindings).
  serverExternalPackages: ["undici"],

  // Remove console.* calls in production builds (except console.error)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"], // Keep console.error for critical errors
          }
        : false,
  },

  // Remove absolute paths from chunk names for security
  webpack: (config, { isServer }) => {
    // Override chunk naming to use relative paths only
    if (config.optimization?.chunkIds !== 'named') {
      config.optimization = config.optimization || {};
      // Use deterministic IDs in production, natural in development
      config.optimization.chunkIds = 
        process.env.NODE_ENV === 'production' ? 'deterministic' : 'named';
    }

    // Override module naming for better security
    if (config.output) {
      config.output.devtoolModuleFilenameTemplate = (info: any) => {
        // Use relative paths from project root instead of absolute paths
        const relativePath = path.relative(process.cwd(), info.absoluteResourcePath);
        return `webpack://${relativePath}`;
      };
    }

    return config;
  },

  images: {
    remotePatterns: [
      // Internal backend URL: Next.js server fetches originals via Docker network
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/media/**",
      },
      // Public-facing URL: media hrefs in API responses use this origin
      ...(publicUrl.hostname !== apiUrl.hostname || publicUrl.port !== apiUrl.port
        ? [
            {
              protocol: publicUrl.protocol.replace(":", "") as "http" | "https",
              hostname: publicUrl.hostname,
              port: publicUrl.port,
              pathname: "/media/**",
            },
          ]
        : []),
    ],
  },

  // Redirect /favicon.ico to /icon for dynamic favicon
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon",
        permanent: false,
      },
    ];
  },

  // Service Worker headers for PWA
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
