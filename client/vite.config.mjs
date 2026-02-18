import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // SockJS এবং পুরনো লাইব্রেরিগুলোর জন্য global ডিফাইন করা হলো
    global: 'window',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve('./node_modules/react'),
    },
  },
  server: {
    // FFmpeg ব্রাউজারে চালানোর জন্য এই হেডারগুলো অত্যন্ত জরুরি
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    // FFmpeg কে প্রাক-অপ্টিমাইজেশন থেকে বাদ রাখা হয় অনেক সময় সমস্যা এড়াতে
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    rollupOptions: {
      // যদি বিল্ডের সময় কোনো মডিউল খুঁজে না পায় তবে এখানে চেক করতে হয়
      external: [],
    },
  },
})