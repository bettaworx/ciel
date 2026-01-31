import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/config.ts");

// Parse NEXT_PUBLIC_API_BASE_URL to allow dynamic hostname configuration
const publicBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:6137";
const url = new URL(publicBaseUrl);
const hostname = url.hostname;
const port = url.port;
const protocol = url.protocol.replace(":", "") as "http" | "https";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Remove console.* calls in production builds (except console.error)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"], // Keep console.error for critical errors
          }
        : false,
  },

  images: {
    remotePatterns: [
      {
        protocol,
        hostname,
        port,
        pathname: "/media/**",
      },
      // Also allow localhost explicitly for development
      ...(hostname !== "localhost"
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
              port: "6137",
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
};

export default withNextIntl(nextConfig);
