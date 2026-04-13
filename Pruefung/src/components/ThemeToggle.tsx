import { useThemeStore } from '../store/themeStore.ts'
import Tooltip from './ui/Tooltip.tsx'

export default function ThemeToggle() {
  const toggleMode = useThemeStore((s) => s.toggleMode)
  const mode = useThemeStore((s) => s.mode)

  // Aktueller visueller Zustand: dunkel oder hell?
  const istAktuellDunkel = mode === 'dark' || (mode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const icon = istAktuellDunkel ? '☀️' : '🌙'
  const label = istAktuellDunkel ? 'Hell' : 'Dunkel'

  return (
    <Tooltip text={`Zu ${label} wechseln`} position="bottom">
    <button
      onClick={toggleMode}
      className="h-8 px-2 rounded-lg flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs"
    >
      <span className="text-sm">{icon}</span>
    </button>
    </Tooltip>
  )
}
