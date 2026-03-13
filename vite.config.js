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
      historyApiFallback: true, 
    },

    optimizeDeps: {
      // ৫-০-৪ এরর এবং ডিপেন্ডেন্সি সমস্যার জন্য এখানে নতুন লাইব্রেরিগুলো যুক্ত করা হয়েছে
      include: [
        'buffer', 
        'stream-browserify', 
        'events',
        'util',
        'process',
        '@mediapipe/face_mesh',
        '@mediapipe/hands',
        '@mediapipe/camera_utils',
        'react-speech-recognition', // ভয়েস কন্ট্রোলের জন্য বাধ্যতামূলক
        'regenerator-runtime/runtime' // অ্যাসিঙ্ক্রোনাস ভয়েস কমান্ডের জন্য
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
              if (id.includes('@mediapipe')) return 'mediapipe'; // মিডিয়াপাইপ আলাদা চাঙ্ক
              return 'vendor';
            }
          }
        }
      },
    },
  };
});
