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
      'global': 'globalThis',
      'process.env': JSON.stringify(env),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // ব্রাউজার সামঞ্জস্যের জন্য পলিফিলস
        'util': 'util/', 
        'stream': 'stream-browserify',
        'buffer': 'buffer',
        'events': 'events',
        'process': 'process/browser',
      },
    },

    server: {
      port: 5173,
      host: true,
      strictPort: true,
      // historyApiFallback এর পরিবর্তে Vite-এর বিল্ট-ইন SPA হ্যান্ডলিং
      historyApiFallback: true, 
    },

    optimizeDeps: {
      // Node.js মডিউলগুলোকে ব্রাউজারে চালানোর জন্য ফোর্স করা
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
      chunkSizeWarningLimit: 4000,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            // বড় ডিপেন্ডেন্সিগুলোকে আলাদা করে পারফরম্যান্স বাড়ানো
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      },
    },
  };
});