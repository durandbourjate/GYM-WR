import { useThemeStore } from '../store/themeStore.ts'
import Tooltip from './ui/Tooltip.tsx'

export default function ThemeToggle() {
  const toggleMode = useThemeStore((s) => s.toggleMode)
  const mode = useThemeStore((s) => s.mode)

  const label =
    mode === 'light' ? 'Hell' : mode === 'dark' ? 'Dunkel' : 'System'

  const icon = mode === 'system' ? '🖥️' : mode === 'light' ? '☀️' : '🌙'

  return (
    <Tooltip text={`Modus: ${label} (klicken zum Wechseln)`} position="bottom">
    <button
      onClick={toggleMode}
      className="h-8 px-2 rounded-lg flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs"
    >
      <span className="text-sm">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
    </Tooltip>
  )
}
