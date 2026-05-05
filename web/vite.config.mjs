import { defineConfig } from "vite";
import rescript from "@jihchi/vite-plugin-rescript";

export default defineConfig({
  plugins: [rescript()],
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    target: "es2020",
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {},
  },
});
