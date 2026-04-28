import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../packages/shared/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify('test'),
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      '../packages/shared/src/**/*.test.{ts,tsx}',
    ],
  },
})
