import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const api = { "/api": { target: "http://localhost:3000", changeOrigin: false } };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: api,
    // Transform the entry and the two lazy pages when the server starts, so the first test of a run
    // does not wait for a cold dev server (the e2e run found this, see adrs/testing-and-observability-evidence.md).
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/pages/CheckoutPage.tsx", "./src/pages/OrderPage.tsx"],
    },
  },
  preview: { port: 5173, strictPort: true, proxy: api },
  // The checkout is a lazy route, so the dev server would find its libraries only when a first visit
  // opens it, then bundle them and reload the page. Listing them here bundles them at start.
  optimizeDeps: { include: ["react-hook-form", "@hookform/resolvers/zod", "zod"] },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
