import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages project site: base MUST equal "/<RepoName>/".
const BASE = "/McDonaldOhioWater/";

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  define: {
    // Re-evaluated on every `vite build`, so the live site shows deploy time.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "McDonald Ohio Water Accounts Map",
        short_name: "McDonald Water",
        description:
          "Interactive map of McDonald, Ohio municipal water service accounts.",
        theme_color: "#1a2a3a",
        background_color: "#1a2a3a",
        display: "standalone",
        orientation: "any",
        // scope + start_url MUST match the Pages base path or install/offline breaks.
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the app shell + JS/CSS; cache map tiles and the data JSON at runtime.
        globPatterns: ["**/*.{js,css,html,png,svg,json}"],
        // The locations.json is ~1.4 MB; raise the precache size ceiling to include it.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.host.includes("tile.openstreetmap.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
