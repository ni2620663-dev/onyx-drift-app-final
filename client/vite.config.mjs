import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // simple-peer এবং অন্যান্য পুরনো লাইব্রেরিগুলোর জন্য global এবং process ডিফাইন করা হলো
    global: 'window',
    'process.env': {}, // এটি প্রোডাকশন এরর কমাতে সাহায্য করবে
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // simple-peer এর জন্য অনেক সময় stream বা buffer এর প্রয়োজন হয়, তবে আপাতত এগুলো থাক
      react: path.resolve('./node_modules/react'),
    },
  },
  server: {
    // FFmpeg এবং SharedArrayBuffer ব্যবহারের জন্য এই হেডারগুলো সঠিক আছে
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    // FFmpeg কে অপ্টিমাইজেশন থেকে বাদ রাখা ঠিক আছে
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    // simple-peer কে অনেক সময় এখানে ইনক্লুড করতে হয় যদি এরর আসে
    include: ['simple-peer'], 
  },
  build: {
    rollupOptions: {
      external: [],
    },
    // বড় প্রোজেক্টের জন্য কমন চাঙ্ক সাইজ বাড়ানো
    chunkSizeWarningLimit: 1600,
  },
})