import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 5173, host: true },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Charts are only needed inside the dashboards, so keep recharts out of
        // the bundle a first-time visitor downloads for the landing page.
        manualChunks: {
          charts: ["recharts"],
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
