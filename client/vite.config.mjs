import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Modules-এ __dirname সেটআপ
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  
  define: {
    // 🛠️ Simple-peer এবং Node.js লাইব্রেরির গ্লোবাল অবজেক্ট ফিক্স
    global: 'window',
    'process.env': {},
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      
      // 🛠️ পলিফিল ম্যাপিং (Browser-এ Node.js ফিচার চালানোর জন্য)
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
      events: 'events',
      process: 'process/browser',
    },
  },

  server: {
    port: 5173,
    host: true, 
    // নোট: External images (Google, Dicebear) ব্লক হওয়া ঠেকাতে 
    // "Cross-Origin-Embedder-Policy" সরিয়ে ফেলা হয়েছে।
    headers: {}, 
  },

  optimizeDeps: {
    // FFmpeg-কে অপ্টিমাইজেশন থেকে বাদ রাখা হয়েছে
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    
    // 🛠️ পলিফিলগুলোকে ফোর্স অপ্টিমাইজ করা হচ্ছে যাতে এরর না আসে
    include: [
      'simple-peer', 
      'buffer', 
      'stream-browserify', 
      'util', 
      'events', 
      'process'
    ], 
  },

  build: {
    rollupOptions: {
      external: [],
    },
    chunkSizeWarningLimit: 2000,
  },
})