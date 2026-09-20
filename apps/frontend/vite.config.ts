import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { cielRuntimePlugin, dropLegacyWoffPlugin } from "./vite-plugin-ciel.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** Hosts allowed to reach the dev/preview server (Tailscale, LAN, …). */
const allowedHosts = (process.env.DEV_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const backendOrigin = (process.env.INTERNAL_API_BASE_URL || "http://localhost:6137").replace(
  /\/api\/v1\/?$|\/+$/,
  "",
);

/**
 * The manifest is served by the backend but must look same-origin to the
 * browser, or its relative start_url falls outside the app's scope. nginx does
 * this in production; dev and preview proxy it here.
 */
const proxy = {
  "/pwa/manifest.json": { target: backendOrigin, changeOrigin: true },
};

export default defineConfig({
  plugins: [
    cielRuntimePlugin(),
    tanstackRouter({
      target: "react",
      routesDirectory: "./routes",
      generatedRouteTree: "./routeTree.gen.ts",
      autoCodeSplitting: true,
    }),
    // The React Compiler, as `reactCompiler: true` enabled under Next.
    react({ compiler: true }),
    tailwindcss(),
    dropLegacyWoffPlugin(),
  ],
  resolve: {
    // "@" points at the package root, exactly as it did under Next, so no
    // import in components/, lib/, atoms/ or providers/ had to change.
    alias: { "@": projectRoot.replace(/[/\\]$/, "") },
  },
  define: {
    "import.meta.env.VITE_BUILD_COMMIT": JSON.stringify(process.env.BUILD_COMMIT ?? "dev"),
    "import.meta.env.VITE_BUILD_BRANCH": JSON.stringify(process.env.BUILD_BRANCH ?? "dev"),
    "import.meta.env.VITE_BUILD_VERSION": JSON.stringify(
      process.env.npm_package_version ?? "0.0.0",
    ),
  },
  server: { port: 3000, allowedHosts, proxy },
  preview: { port: 3000, allowedHosts, proxy },
  build: {
    sourcemap: false,
    // Chunk names stay stable across builds so long-lived caches keep working.
    rollupOptions: { output: { hashCharacters: "hex" } },
  },
});
