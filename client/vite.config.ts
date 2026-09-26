import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tmpdir } from "node:os";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  cacheDir: path.join(tmpdir(), "toktickit-vite-cache"),
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    include: ["tests/**/*.test.tsx"],
  },
});
