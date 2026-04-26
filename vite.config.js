import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
function resolveBasePath() {
    var _a;
    var explicitBasePath = process.env.VITE_BASE_PATH;
    if (explicitBasePath) {
        return explicitBasePath.endsWith("/")
            ? explicitBasePath
            : "".concat(explicitBasePath, "/");
    }
    var repository = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split("/")[1];
    if (!repository || repository.endsWith(".github.io")) {
        return "/";
    }
    return "/".concat(repository, "/");
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
