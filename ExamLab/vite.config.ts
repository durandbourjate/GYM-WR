import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Unified Build: Ein einziger Base-Path für ExamLab
// Im Dev-Modus (npm run dev) → '/' für lokale Entwicklung
const istDev = process.env.NODE_ENV !== 'production' && !process.env.VITE_BASE_PATH
const basePath = process.env.VITE_BASE_PATH || (istDev ? '/' : '/GYM-WR-DUY/ExamLab/')
// RegExp für navigateFallbackAllowlist aus basePath ableiten
const basePathEscaped = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// PWA-Manifest
const pwaManifest = {
  name: 'ExamLab',
  short_name: 'ExamLab',
  description: 'Digitale Prüfungs- und Übungsplattform',
  theme_color: '#1e40af',
  background_color: '#f8fafc',
}

export default defineConfig({
  base: basePath,
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })),
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../packages/shared/src'),
      // Pinne @dnd-kit/* auf ExamLab/node_modules damit shared-Editoren (z.B. SortierungEditor)
      // dieselbe Instanz verwenden — sonst Doppel-React-Hooks bei Build oder Test.
      '@dnd-kit/core': path.resolve(__dirname, 'node_modules/@dnd-kit/core'),
      '@dnd-kit/sortable': path.resolve(__dirname, 'node_modules/@dnd-kit/sortable'),
      '@dnd-kit/utilities': path.resolve(__dirname, 'node_modules/@dnd-kit/utilities')
    },
    dedupe: ['react', 'react-dom']
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        ...pwaManifest,
        display: 'standalone',
        scope: basePath,
        start_url: basePath,
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [new RegExp(`^${basePathEscaped}(\\/|$)`)],
        // Statische Dateien NICHT durch SPA-Fallback ersetzen
        navigateFallbackDenylist: [/\.pdf$/i, /\.png$/i, /\.jpg$/i, /\.jpeg$/i, /\.gif$/i, /\.svg$/i, /\.mp3$/i, /\.mp4$/i, /\.webm$/i, /\/materialien\//],
        // Bilder für Pool-Fragen cachen (Üben-Modus)
        runtimeCaching: [{
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/i,
          handler: 'CacheFirst',
          options: { cacheName: 'images', expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 } }
        }],
      },
    }),
  ],
})
