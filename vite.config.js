import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    publicDir: 'public', // public ফোল্ডার থেকে ফাইল সার্ভ নিশ্চিত করে

    plugins: [react()],

    define: {
      'global': 'globalThis',
      'process.env': JSON.stringify(env),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'stream': 'stream-browserify',
        'buffer': 'buffer',
        'events': 'events',
        'util': 'util',
        'process': 'process/browser',
      },
    },

    server: {
      port: 5173,
      host: true,
      fs: {
        strict: false, // ফাইল সিস্টেম এক্সেস সহজ করে
      },
      // 🚀 এটিই আসল সমাধান: ডটওয়ালা ফাইলকে (যেমন .js, .wasm) রাউট মনে করবে না
      historyApiFallback: {
        disableDotRule: true 
      }
    },

    optimizeDeps: {
      include: [
        'buffer', 
        'stream-browserify', 
        'events',
        'util',
        'process',
        '@mediapipe/face_mesh',
        '@mediapipe/hands',
      ],
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: undefined 
        }
      },
      chunkSizeWarningLimit: 4000,
    },
  };
});