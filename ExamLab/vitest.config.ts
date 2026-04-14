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
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
