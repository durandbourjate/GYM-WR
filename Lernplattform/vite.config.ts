import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const basePath = process.env.VITE_BASE_PATH || '/GYM-WR-DUY/Lernplattform/'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Lernplattform — Gymnasium Hofwil',
        short_name: 'Lernen',
        description: 'Ueben und Lernen',
        theme_color: '#3b82f6',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: basePath,
        start_url: basePath,
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  base: basePath,
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../packages/shared/src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
