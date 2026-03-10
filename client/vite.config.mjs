import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    define: {
      // MediaPipe এবং অন্যান্য লাইব্রেরির জন্য global এবং process.env নিশ্চিত করা
      'global': 'window',
      'process.env': JSON.stringify(env),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // ব্রাউজার সামঞ্জস্যতার জন্য পলিফিল এলিয়াস
        'stream': 'stream-browserify',
        'buffer': 'buffer',
        'events': 'events',
        'util': 'util', // এটি যোগ করা হয়েছে 'Module util externalized' এরর বন্ধ করতে
      },
    },

    server: {
      port: 5173,
      host: true,
      // HMR এবং ফাইল ওয়াচিং ঠিক রাখতে
      watch: {
        usePolling: true,
      },
    },

    optimizeDeps: {
      include: [
        'buffer', 
        'stream-browserify', 
        'events',
        'util',
        '@mediapipe/face_mesh',
        '@mediapipe/hands',
        '@mediapipe/camera_utils'
      ],
      // CommonJS মডিউলগুলোকে সঠিকভাবে হ্যান্ডেল করতে
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },

    build: {
      outDir: 'dist',
      // বড় ফাইলগুলোর জন্য সোর্স ম্যাপ তৈরি বন্ধ রাখা ভালো (অপশনাল)
      sourcemap: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            // MediaPipe লাইব্রেরিগুলোকে আলাদা ফাইলে রাখা যাতে মেইন বান্ডেল ছোট থাকে
            if (id.includes('@mediapipe')) {
              return 'mediapipe_core';
            }
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      },
      // MediaPipe এর বড় সাইজের জন্য ওয়ার্নিং লিমিট বাড়ানো হয়েছে
      chunkSizeWarningLimit: 4000,
    },
  };
});
