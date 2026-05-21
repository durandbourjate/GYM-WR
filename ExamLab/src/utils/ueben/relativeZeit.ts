// ExamLab/src/utils/ueben/relativeZeit.ts

/** Gibt einen relativen Zeitstring zurück, z.B. „vor 2 Tagen" */
export function formatiereRelativeZeit(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sekunden = Math.floor(diff / 1000)
  const minuten = Math.floor(sekunden / 60)
  const stunden = Math.floor(minuten / 60)
  const tage = Math.floor(stunden / 24)

  if (tage > 365) return `vor ${Math.floor(tage / 365)} Jahr${Math.floor(tage / 365) !== 1 ? 'en' : ''}`
  if (tage > 30) return `vor ${Math.floor(tage / 30)} Monat${Math.floor(tage / 30) !== 1 ? 'en' : ''}`
  if (tage > 1) return `vor ${tage} Tagen`
  if (tage === 1) return 'gestern'
  if (stunden > 1) return `vor ${stunden} Stunden`
  if (stunden === 1) return 'vor einer Stunde'
  if (minuten > 1) return `vor ${minuten} Minuten`
  return 'gerade eben'
}
