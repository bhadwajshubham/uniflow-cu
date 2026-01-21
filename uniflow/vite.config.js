import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'UniFlow-cu',
        short_name: 'UniFlow-cu',
        description: 'Campus Event Management',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // 🛡️ CRITICAL FIX: Increase limit to 4MB (Default is 2MB)
        // This prevents the "Assets exceeding the limit" error
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, 
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    // ⚡ ARCHITECT FIX: Split heavy libraries into separate files
    // This makes your main app load faster
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Put libraries like Recharts & Firebase in a separate "vendor" file
            return 'vendor';
          }
        }
      }
    }
  }
});