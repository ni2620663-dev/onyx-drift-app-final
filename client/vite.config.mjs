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
      'global': 'window',
      'process.env': JSON.stringify(env),
      'util.debuglog': 'undefined',
      'util.inspect.custom': 'undefined',
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
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
      outDir: 'dist',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
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