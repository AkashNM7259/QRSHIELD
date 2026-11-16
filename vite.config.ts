import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    allowedHosts: ['.up.railway.app', '.railway.app'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-pdf': ['jspdf'],
          'vendor-qr': ['jsqr', 'qrcode'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
