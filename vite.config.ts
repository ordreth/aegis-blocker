import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import manifest from "./manifest.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  build: {
    target: "es2023",
    sourcemap: false,
    // Chromium preloads modules natively; the polyfill would only add a fetch() call
    // to pages whose policy forbids network access.
    modulePreload: { polyfill: false },
    // The block page is only reachable through web_accessible_resources, which the
    // plugin copies untouched unless it is also a build entry.
    rollupOptions: { input: { blocked: "blocked.html" } },
  },
  server: { port: 5173, strictPort: true, hmr: { port: 5173 } },
  test: {
    globals: true,
    environment: "node",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
