import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Standalone-vitest-Config für `cd packages/shared && npm test`.
// Beim Lauf via ExamLab-CI (`cd ExamLab && npm test`) greift stattdessen
// ExamLab/vitest.config.ts (inkludiert packages/shared/**/*.test via glob).
// Diese Config muss daher die gleichen Grundbausteine liefern: React-Plugin
// für JSX-Transform, jest-dom-Matcher via setupFile, und den @shared-Alias
// (manche shared-Tests importieren ihre Source via @shared/...).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
