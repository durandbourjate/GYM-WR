import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/GYM-WR-DUY/Pruefung/',
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
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
        scope: '/GYM-WR-DUY/Pruefung/',
        start_url: '/GYM-WR-DUY/Pruefung/',
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
        navigateFallbackAllowlist: [/^\/GYM-WR-DUY\/Pruefung(\/|$)/],
        // Statische Dateien (PDFs, Bilder, Audio/Video) NICHT durch SPA-Fallback ersetzen
        navigateFallbackDenylist: [/\.pdf$/i, /\.png$/i, /\.jpg$/i, /\.jpeg$/i, /\.gif$/i, /\.svg$/i, /\.mp3$/i, /\.mp4$/i, /\.webm$/i, /\/materialien\//],
      },
    }),
  ],
})
