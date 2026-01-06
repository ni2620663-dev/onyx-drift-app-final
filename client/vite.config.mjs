import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // SockJS এবং পুরনো লাইব্রেরিগুলোর জন্য global ডিফাইন করা হলো
    global: 'window',
  },
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
    },
  },
})