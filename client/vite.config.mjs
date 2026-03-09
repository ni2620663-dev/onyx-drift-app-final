import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules-এ __dirname সেটআপ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  
  define: {
    // 🛠️ Simple-peer এবং অন্যান্য Node.js লাইব্রেরির গ্লোবাল অবজেক্ট ফিক্স
    global: 'window',
    'process.env': {},
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      
      // 🛠️ পলিফিল ম্যাপিং
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
      events: 'events',
      process: 'process/browser',
      // react-webcam রেজোলিউশন নিশ্চিত করা
      'react-webcam': 'react-webcam'
    },
  },

  server: {
    port: 5173,
    host: true,
  },

  optimizeDeps: {
    // FFmpeg-কে অপ্টিমাইজেশন থেকে বাদ রাখা
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    
    // 🛠️ পলিফিলগুলোকে ফোর্স অপ্টিমাইজ করা
    include: [
      'simple-peer', 
      'buffer', 
      'stream-browserify', 
      'util', 
      'events', 
      'process',
      'react-webcam' // অপ্টিমাইজেশনে যোগ করা হয়েছে
    ], 
  },

  build: {
    // Rollup options
    rollupOptions: {
      // react-webcam কে এক্সটারনাল করবেন না, এতে বিল্ড ফাইল ক্র্যাশ করবে
      external: [], 
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000,
    sourcemap: false, // প্রোডাকশনে বিল্ড দ্রুত করার জন্য
  },
});