import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // npm-Workspaces hoisten alle Deps auf eine Root-node_modules.
    // dedupe sichert Single-Instance, sobald Komponenten-Tests dazukommen.
    dedupe: ['react', 'react-dom', 'zustand'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
