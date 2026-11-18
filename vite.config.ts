/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // served from /Gesture-Particles/ (see .github/workflows/deploy.yml)
  base: '/Gesture-Particles/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      // three.js on its own, so it stays cached when the app changes
      output: { manualChunks: { three: ['three'] } },
    },
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
  },
});
