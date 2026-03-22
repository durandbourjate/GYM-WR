/**
 * Validierung von Prüfungsfragen.
 * Extrahiert aus FragenEditor.tsx — pure Funktion ohne Komponentenabhängigkeiten.
 */
import type { MCOption, SollHabenZeile, Kontenaufgabe, KontoMitSaldo } from '../types/fragen.ts'

export interface FrageValidierungsParams {
  typ: string
  thema: string
  fragetext: string
  punkte: number
  optionen?: MCOption[]
  mehrfachauswahl?: boolean
  textMitLuecken?: string
  paare?: Array<{ links: string; rechts: string }>
  aussagen?: Array<{ text: string }>
  ergebnisse?: Array<{ bezeichnung?: string; label?: string; ergebnis?: string | number }>
  geschaeftsfall?: string
  buchungen?: SollHabenZeile[]
  tkAufgabentext?: string
  tkKonten?: Array<{ kontonummer: string }>
  kbAufgabentext?: string
  kbAufgaben?: Kontenaufgabe[]
  biAufgabentext?: string
  biKontenMitSaldi?: KontoMitSaldo[]
  agKontext?: string
  agTeilaufgabenIds?: string[]
}

/** Validiert eine Frage und gibt eine Liste von Fehlermeldungen zurück (leer = valide) */
export function validiereFrage(params: FrageValidierungsParams): string[] {
  const errs: string[] = []
  const { typ, thema, fragetext, punkte } = params

  if (!thema.trim()) errs.push('Thema fehlt')
  if (!fragetext.trim() && typ !== 'tkonto' && typ !== 'kontenbestimmung' && typ !== 'bilanzstruktur' && typ !== 'aufgabengruppe') errs.push('Fragetext fehlt')
  if (punkte <= 0) errs.push('Punkte müssen > 0 sein')

  if (typ === 'mc' && params.optionen) {
    if (params.optionen.filter((o) => o.text.trim()).length < 2) errs.push('Mindestens 2 Optionen nötig')
    if (!params.optionen.some((o) => o.korrekt)) errs.push('Mindestens 1 korrekte Option nötig')
  }
  if (typ === 'lueckentext') {
    if (!params.textMitLuecken?.includes('{{')) errs.push('Lückentext braucht {{1}}-Platzhalter')
  }
  if (typ === 'zuordnung') {
    if ((params.paare?.filter((p) => p.links.trim() && p.rechts.trim()).length ?? 0) < 2) errs.push('Mindestens 2 Paare nötig')
  }
  if (typ === 'richtigfalsch') {
    if ((params.aussagen?.filter((a) => a.text.trim()).length ?? 0) < 2) errs.push('Mindestens 2 Aussagen nötig')
  }
  if (typ === 'berechnung') {
    if ((params.ergebnisse?.filter((e) => (e.label ?? e.bezeichnung ?? '').trim()).length ?? 0) < 1) errs.push('Mindestens 1 Ergebnis nötig')
  }
  if (typ === 'buchungssatz') {
    if (!params.geschaeftsfall?.trim()) errs.push('Geschäftsfall erforderlich')
    if ((params.buchungen?.filter(b => b.sollKonten.some(k => k.kontonummer) || b.habenKonten.some(k => k.kontonummer)).length ?? 0) < 1) {
      errs.push('Mindestens 1 Buchung mit Konten nötig')
    }
  }
  if (typ === 'tkonto') {
    if (!params.tkAufgabentext?.trim()) errs.push('Aufgabentext erforderlich')
    if ((params.tkKonten?.filter(k => k.kontonummer).length ?? 0) < 1) {
      errs.push('Mindestens 1 T-Konto mit Kontonummer nötig')
    }
  }
  if (typ === 'kontenbestimmung') {
    if (!params.kbAufgabentext?.trim()) errs.push('Aufgabentext erforderlich')
    if ((params.kbAufgaben?.filter(a => a.text.trim()).length ?? 0) < 1) {
      errs.push('Mindestens 1 Aufgabe mit Text nötig')
    }
  }
  if (typ === 'bilanzstruktur') {
    if (!params.biAufgabentext?.trim()) errs.push('Aufgabentext erforderlich')
    if ((params.biKontenMitSaldi?.filter(k => k.kontonummer).length ?? 0) < 1) {
      errs.push('Mindestens 1 Konto mit Saldo nötig')
    }
  }
  if (typ === 'aufgabengruppe') {
    if (!params.agKontext?.trim()) errs.push('Kontext erforderlich')
    if ((params.agTeilaufgabenIds?.length ?? 0) < 1) errs.push('Mindestens 1 Teilaufgabe erforderlich')
  }

  return errs
}
