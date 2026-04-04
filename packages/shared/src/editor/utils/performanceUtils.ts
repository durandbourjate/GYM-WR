/** Textfarbe für Lösungsquote (grün/amber/rot) */
export function loesungsquoteFarbe(quote: number): string {
  if (quote >= 70) return 'text-green-600 dark:text-green-400'
  if (quote >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

/** Hintergrundfarbe für Lösungsquote */
export function loesungsquoteBgFarbe(quote: number): string {
  if (quote >= 70) return 'bg-green-500'
  if (quote >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}
