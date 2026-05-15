/**
 * TagFarbeChip — Farbiger Chip zur Anzeige eines Tags (Cluster H Phase 2 B1).
 *
 * 8 Tailwind-Farbtokens (slate/red/amber/emerald/sky/violet/pink/stone) mit
 * dark-mode bg-Paaren. Re-use in TagsListe (Verwaltungs-UI) und in
 * Frage-Karten/-Details.
 */
import type { TagFarbe } from '@shared/types/tag'

const FARBE_KLASSEN: Record<TagFarbe, string> = {
  slate:   'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  red:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200',
  amber:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200',
  sky:     'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-200',
  violet:  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200',
  pink:    'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200',
  stone:   'bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200',
}

interface Props {
  farbe: TagFarbe
  label: string
  size?: 'sm' | 'md'
  onClick?: () => void
}

export function TagFarbeChip({ farbe, label, size = 'md', onClick }: Props) {
  const sizeKlassen = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'
  return (
    <span
      className={`inline-flex items-center rounded-full ${FARBE_KLASSEN[farbe]} ${sizeKlassen} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      {label}
    </span>
  )
}
