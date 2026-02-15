import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: false, // We are managing the manifest manually in public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // jsPDF 4.x increases bundle size; allow larger asset precache.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      }
    })
  ],
  worker: {
    format: 'es'
  }
})
