import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __API_ENDPOINT__: JSON.stringify(
      mode === "development"
        ? "http://localhost:3000/parseRecipe"
        : "https://v1a40itwqj.execute-api.us-east-1.amazonaws.com/dev/parseRecipe",
    ),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
