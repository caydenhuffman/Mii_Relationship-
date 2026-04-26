import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

function resolveBasePath() {
  const explicitBasePath = process.env.VITE_BASE_PATH;

  if (explicitBasePath) {
    return explicitBasePath.endsWith("/")
      ? explicitBasePath
      : `${explicitBasePath}/`;
  }

  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];

  if (!repository || repository.endsWith(".github.io")) {
    return "/";
  }

  return `/${repository}/`;
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    css: true,
  },
});
