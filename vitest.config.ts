import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  define: {
    __API_ENDPOINT__: JSON.stringify("http://test.local/parseRecipe"),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
