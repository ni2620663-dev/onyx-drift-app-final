import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // MediaPipe এর অ্যাসেটগুলো সরাসরি dist ফোল্ডারে কপি করার জন্য এটি যোগ করুন
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/@mediapipe/face_mesh/*.{wasm,binarypb}',
            dest: 'mediapipe'
          },
          {
            src: 'node_modules/@mediapipe/hands/*.{wasm,binarypb}',
            dest: 'mediapipe'
          }
        ]
      })
    ],

    define: {
      'global': 'window',
      'process.env': JSON.stringify(env),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Node.js মডিউলগুলোর জন্য ব্রাউজার কমপ্যাটিবল ভার্সন ব্যবহার করুন
        'stream': 'stream-browserify',
        'buffer': 'buffer',
        'events': 'events',
      },
    },

    server: {
      port: 5173,
      host: true,
      // সিকিউরিটি হেডার এখানে সরাসরি দেওয়ার বদলে vercel.json-এ রাখা বেশি কার্যকর
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      },
    },

    optimizeDeps: {
      include: [
        'buffer', 
        'stream-browserify', 
        'events',
        '@mediapipe/face_mesh',
        '@mediapipe/hands',
        '@mediapipe/camera_utils'
      ],
    },

    build: {
      outDir: 'dist',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@mediapipe')) return 'mediapipe_core';
              return 'vendor';
            }
          }
        }
      },
      chunkSizeWarningLimit: 3000,
    },
  };
});