import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        find: /^\.\/libsodium-sumo\.mjs$/,
        replacement: path.resolve(__dirname, '../../node_modules/libsodium-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['libsodium-wrappers-sumo', 'libsodium-sumo'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
