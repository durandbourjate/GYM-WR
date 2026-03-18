import type { LueckentextFrage } from '../../../types/fragen.ts'

export type FrageTyp = 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung'

export function generiereFrageId(fachbereich: string, typ: string): string {
  const fb = fachbereich.toLowerCase()
  const typKuerzel: Record<string, string> = {
    mc: 'mc', freitext: 'ft', lueckentext: 'lt', zuordnung: 'zu',
    richtigfalsch: 'rf', berechnung: 'be',
  }
  const typKurz = typKuerzel[typ] ?? typ.slice(0, 2)
  const rand = Math.random().toString(36).slice(2, 6)
  return `${fb}-${typKurz}-${rand}`
}

export function parseLuecken(text: string): LueckentextFrage['luecken'] {
  const matches = text.match(/\{\{(\d+)\}\}/g)
  if (!matches) return []
  const ids = [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
  return ids.map((id) => ({ id, korrekteAntworten: [''], caseSensitive: false }))
}
