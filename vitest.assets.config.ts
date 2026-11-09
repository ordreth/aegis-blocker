import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Renders the real UI to static HTML for the store screenshots (see scripts/assets).
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  test: {
    environment: "jsdom",
    include: ["scripts/assets/*.scene.tsx"],
    testTimeout: 60_000,
  },
});
