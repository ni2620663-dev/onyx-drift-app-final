import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "./", // client folder is root
  plugins: [react()],
  build: {
    outDir: "dist", // build output inside client/dist
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});
