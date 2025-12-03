import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// এটি অনুমান করছে যে আপনি 'path' ব্যবহার করার জন্য 'type: "module"'
// বা 'client/package.json'-এ type: "module" সেট করেছেন।
// '__dirname' ব্যবহার করার জন্য, আপনাকে path.resolve ব্যবহার করতে হবে।

export default defineConfig({
  // এটিই প্রধান কনফিগারেশন ব্লক। ডুপ্লিকেট অংশগুলো বাদ দিন।
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src") // আপনার alias কনফিগারেশন
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});