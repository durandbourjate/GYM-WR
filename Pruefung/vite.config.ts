import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Base-Path: Standard = Production, überschreibbar für Staging via VITE_BASE_PATH
const basePath = process.env.VITE_BASE_PATH || '/GYM-WR-DUY/Pruefung/'
// RegExp für navigateFallbackAllowlist aus basePath ableiten
const basePathEscaped = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineConfig({
  base: basePath,
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../packages/shared/src')
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
        name: 'Prüfungsplattform — Gymnasium Hofwil',
        short_name: 'Prüfung',
        description: 'Digitale Prüfungsplattform',
        theme_color: '#1e40af',
        background_color: '#f8fafc',
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
        // Statische Dateien (PDFs, Bilder, Audio/Video) NICHT durch SPA-Fallback ersetzen
        navigateFallbackDenylist: [/\.pdf$/i, /\.png$/i, /\.jpg$/i, /\.jpeg$/i, /\.gif$/i, /\.svg$/i, /\.mp3$/i, /\.mp4$/i, /\.webm$/i, /\/materialien\//],
      },
    }),
  ],
})
