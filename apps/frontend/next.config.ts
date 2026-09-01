import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/config.ts");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",

  // Build provenance. These are embedded intentionally so running frontend
  // images can be matched back to their source commit and branch.
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
  webpack: (config) => {
    // Override chunk naming to use relative paths only
    if (config.optimization?.chunkIds !== 'named') {
      config.optimization = config.optimization || {};
      // Use deterministic IDs in production, natural in development
      config.optimization.chunkIds = 
        process.env.NODE_ENV === 'production' ? 'deterministic' : 'named';
    }

    // Override module naming for better security.
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
      {
        protocol: "http",
        hostname: "**",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/media/**",
      },
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
      {
        source: "/.well-known/change-password",
        destination: "/settings/security",
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
