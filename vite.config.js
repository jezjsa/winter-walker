import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "CONVEX_"],
  server: {
    port: 5175,
    strictPort: true,
  },
});
