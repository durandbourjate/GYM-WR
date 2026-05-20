import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../packages/shared/src'),
    },
    // npm workspaces hoistet alle Deps auf eine einzige Root-node_modules-Kopie.
    // dedupe stellt sicher, dass react/react-dom/zustand single-instance bleiben
    // (auch wenn packages/shared-Tests mitlaufen). KEINE hardcodierten
    // node_modules-Pfad-Aliases mehr — die brachen im CI, weil dort nach dem
    // Workspace-Install kein ExamLab/node_modules/ existiert (alles in Root).
    dedupe: ['react', 'react-dom', 'zustand'],
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
