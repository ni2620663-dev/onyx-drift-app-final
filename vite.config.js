import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // publicDir নিশ্চিত করে যে আপনার public ফোল্ডারের সব ফাইল 
  // বিল্ড হওয়ার সময় dist ফোল্ডারে কপি হবে
  publicDir: 'public', 
  
  server: {
    // HMR কনফিগারেশন
    hmr: {
      overlay: false
    },
    // পোর্ট বা অন্যান্য কনফিগারেশন এখানে যোগ করতে পারেন
    port: 5173 
  },

  build: {
    // প্রোডাকশন বিল্ডের সময় ফাইলগুলো যেন ঠিকমতো কপি হয়
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // যদি প্রয়োজন হয় তবে এখানে অ্যাসেট হ্যান্ডলিং যোগ করা যায়
    }
  }
});