import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/GYM-WR-DUY/Lernplattform/',
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
