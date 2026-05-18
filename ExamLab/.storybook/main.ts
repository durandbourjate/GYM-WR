import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Storybook 10 (minimal Setup für Icon-Galerie).
 *
 * Cluster G Spec §13: Storybook-Setup für Icon-Drift-Prevention. Eine
 * gepflegte Galerie aller Lucide-Icons + Custom-Icons macht es einfach,
 * neue Icons konsistent zu vergeben (Style, Größe, ARIA).
 *
 * Bewusste Minimal-Konfiguration: nur Core + addon-docs. Keine
 * vitest-Integration, kein Playwright, kein A11y-Addon — diese können
 * später ergänzt werden, wenn ein konkreter Nutzen besteht.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Storybook erbt die Vite-Config der App. PWA + KaTeX-Optimizer + andere
  // App-spezifische Plugins gehören nicht in den Storybook-Build — sie
  // erwarten Service-Worker-Targets und Asset-Pfade die hier nicht existieren.
  async viteFinal(config) {
    // PWA + KaTeX-spezifische Plugins gehören nicht in den Storybook-Build.
    // Storybook erbt die App-Vite-Config; wir filtern rekursiv (Plugin-Arrays
    // können verschachtelt sein und müssen flach durchsucht werden).
    function filterPlugins(plugins: unknown): unknown[] {
      if (!Array.isArray(plugins)) return []
      return plugins.flat(Infinity).filter((p) => {
        if (!p || typeof p !== 'object') return true
        const name = (p as { name?: string }).name ?? ''
        return !name.startsWith('vite-plugin-pwa') && name !== 'vite-plugin-pwa'
      })
    }
    config.plugins = filterPlugins(config.plugins) as typeof config.plugins
    return config
  },
}

export default config
