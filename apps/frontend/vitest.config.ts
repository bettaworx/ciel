import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@" root the app build uses.
    alias: { "@": import.meta.dirname },
  },
  test: {
    globals: true,
    include: ["**/*.test.ts"],
  },
});
