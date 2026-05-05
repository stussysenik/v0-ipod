import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  resolve: {
    extensions: [".mjs", ".js"],
  },
  build: {
    outDir: "dist",
    target: "es2020",
    rollupOptions: {
      input: "index.html",
    },
  },
  server: {
    port: 3000,
  },
});
