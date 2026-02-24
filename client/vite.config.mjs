import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Modules এ __dirname সাপোর্ট করার জন্য
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // simple-peer এবং Node.js ভিত্তিক লাইব্রেরিগুলোর জন্য গ্লোবাল অবজেক্ট ফিক্স
    global: 'window',
    'process.env': process.env, 
  },
  resolve: {
    alias: {
      // পাথ এলিয়াস
      '@': path.resolve(__dirname, './src'),
      
      // simple-peer এর জন্য অনেক সময় 'stream' বা 'buffer' প্রয়োজন হয়
      // যদি ভবিষ্যতে এরর আসে তবে নিচের লাইনটি আনকমেন্ট করুন
      // stream: 'stream-browserify',
      // buffer: 'buffer',
    },
  },
  server: {
    // WebRTC এবং FFmpeg (SharedArrayBuffer) ব্যবহারের জন্য সিকিউরিটি হেডার
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    port: 5173,
    host: true, // লোকাল নেটওয়ার্কে টেস্ট করার জন্য
  },
  optimizeDeps: {
    // FFmpeg কে অপ্টিমাইজেশন থেকে বাদ রাখা হয়েছে যাতে এটি সঠিকভাবে লোড হয়
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    
    // simple-peer এবং buffer কে প্রাক-অপ্টিমাইজেশন এ রাখা ভালো
    include: ['simple-peer', 'buffer'], 
  },
  build: {
    rollupOptions: {
      // প্রোডাকশন বিল্ডের সময় কোনো নির্দিষ্ট ফাইল এক্সটার্নাল রাখতে চাইলে এখানে দিন
      external: [],
    },
    // বড় প্রোজেক্টের জন্য ওয়ার্নিং লিমিট বাড়ানো হয়েছে
    chunkSizeWarningLimit: 2000,
  },
})