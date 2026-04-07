const STANDARD_FARBEN: Record<string, string> = {
  VWL: '#f97316', BWL: '#3b82f6', Recht: '#22c55e', Informatik: '#6b7280',
}

export function setzeFachFarben(fachFarben: Record<string, string>): void {
  const root = document.documentElement
  const merged = { ...STANDARD_FARBEN, ...fachFarben }
  for (const [fach, farbe] of Object.entries(merged)) {
    root.style.setProperty(`--c-${fach.toLowerCase()}`, farbe)
  }
}

export function getFachFarbe(fach: string, fachFarben: Record<string, string>): string {
  return fachFarben[fach] || STANDARD_FARBEN[fach] || '#6b7280'
}
