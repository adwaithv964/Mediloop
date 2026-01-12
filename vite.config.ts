import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // Better mobile development experience
    hmr: {
      overlay: false // Disable overlay on mobile for better UX
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable for production mobile builds
    chunkSizeWarningLimit: 600, // Smaller chunk size for mobile networks
    rollupOptions: {
      output: {
        // Code splitting for better mobile loading
        manualChunks: {
          // Vendor chunk for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          ui: ['lucide-react', 'react-hot-toast'],
          // Database and storage
          storage: ['dexie'],
          // Large libraries
          utils: ['crypto-js']
        }
      }
    },
    // Optimize for mobile
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs for production
        drop_debugger: true
      }
    },
    // Better caching for mobile PWA
    assetsInlineLimit: 4096 // Inline small assets
  },
  // Optimize dependencies for mobile
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  },
  // Better mobile preview
  preview: {
    port: 4173,
    host: true
  }
});
