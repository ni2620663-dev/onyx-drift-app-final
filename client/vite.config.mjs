import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // .env ফাইল লোড করা
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    
    define: {
      // গ্লোবাল অবজেক্ট পলিফিল
      'global': 'window',
      'process.env': JSON.stringify(env),
      // util পলিফিল ফিক্স
      'util.debuglog': '(() => (() => {}))', 
      'util.inspect.custom': 'Symbol.for("nodejs.util.inspect.custom")',
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Node.js বিল্ট-ইন মডিউলগুলোর জন্য সঠিক পলিফিল
        'stream': 'stream-browserify',
        'buffer': 'buffer',
        'util': 'util',
        'events': 'events',
        'process': 'process/browser',
      },
    },

    server: {
      port: 5173,
      host: true,
      headers: {
        // MediaPipe/WASM রান করার জন্য অত্যন্ত জরুরি সিকিউরিটি পলিসি
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },

    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
      include: [
        'simple-peer', 
        'buffer', 
        'stream-browserify', 
        'util', 
        'events', 
        'process',
        'react-webcam',
        '@mediapipe/face_mesh',
        '@mediapipe/hands',
        '@mediapipe/camera_utils'
      ],
    },

    build: {
      commonjsOptions: {
        transformMixedEsModules: true, // Mixed ESM/CJS এরর এড়াতে
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // MediaPipe এবং ভারী ইঞ্জিনগুলোকে আলাদা চাস্কে ভাগ করা
              if (id.includes('@mediapipe')) return 'mediapipe_core';
              if (id.includes('three')) return 'three_engine';
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          }
        }
      },
      chunkSizeWarningLimit: 3000,
      sourcemap: false,
      assetsInlineLimit: 0,
    },
  };
});