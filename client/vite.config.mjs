import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: __dirname, // ensures client folder is root
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src") // correct frontend src folder
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true // clean build folder
  }
});
