// ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { Antwort } from '../../../types/antworten.ts'

// === Types ===

export interface EintragZeile {
  id: string
  gegenkonto: string
  betrag: string
  gfNr: string // Geschäftsfall-Nummer
}

export interface KontoEingabe {
  id: string
  beschriftungLinks: string
  beschriftungRechts: string
  kontenkategorie: string
  sollHaben: string              // Legacy (nicht mehr im UI)
  zunahmeAbnahme: string         // Legacy (nicht mehr im UI)
  zunahmeAbnahmeLinks: string
  zunahmeAbnahmeRechts: string
  anfangsbestandLinks: string
  anfangsbestandRechts: string
  eintraegeLinks: EintragZeile[]
  eintraegeRechts: EintragZeile[]
  saldoLinks: string
  saldoRechts: string
}

export type TKontoAntwort = Extract<Antwort, { typ: 'tkonto' }>

export type SusEintrag = { gegenkonto: string; betrag: number }

export type EintragStatus =
  | { art: 'korrekt'; gegenkonto: string; betrag: number }
  | { art: 'falsch'; gegenkonto: string; betrag: number; hinweis: string }
  | { art: 'fehlend'; gegenkonto: string; betrag: number }

export interface KontoBewertung {
  linksStatus: EintragStatus[]
  rechtsStatus: EintragStatus[]
  alleLinksOk: boolean
  alleRechtsOk: boolean
  saldoBalanciert: boolean
  kontoKorrekt: boolean
}

// === Border-Klasse: violett wenn leer + nicht readOnly ===

export function brd(wert: string, readOnly: boolean): string {
  if (readOnly) return 'border-slate-300 dark:border-slate-600'
  return !wert ? 'border-violet-400 dark:border-violet-500' : 'border-slate-300 dark:border-slate-600'
}

// === Factory-Helpers ===

export function neueId(): string {
  return crypto.randomUUID()
}

export function leereZeile(): EintragZeile {
  return { id: neueId(), gegenkonto: '', betrag: '', gfNr: '' }
}

export function leereKontoEingabe(id: string): KontoEingabe {
  return {
    id,
    beschriftungLinks: '',
    beschriftungRechts: '',
    kontenkategorie: '',
    sollHaben: '',
    zunahmeAbnahme: '',
    zunahmeAbnahmeLinks: '',
    zunahmeAbnahmeRechts: '',
    anfangsbestandLinks: '',
    anfangsbestandRechts: '',
    eintraegeLinks: [leereZeile()],
    eintraegeRechts: [leereZeile()],
    saldoLinks: '',
    saldoRechts: '',
  }
}

// === Pure Functions ===

/** Konvertiert die interne Eingabe ins Antwort-Format für den Store */
export function zuAntwort(konten: KontoEingabe[]): TKontoAntwort {
  return {
    typ: 'tkonto' as const,
    konten: konten.map((k) => ({
      id: k.id,
      beschriftungLinks: k.beschriftungLinks || undefined,
      beschriftungRechts: k.beschriftungRechts || undefined,
      kontenkategorie: k.kontenkategorie || undefined,
      sollHaben: k.sollHaben || undefined,
      zunahmeAbnahme: k.zunahmeAbnahme || undefined,
      zunahmeAbnahmeLinks: k.zunahmeAbnahmeLinks || undefined,
      zunahmeAbnahmeRechts: k.zunahmeAbnahmeRechts || undefined,
      eintraegeLinks: k.eintraegeLinks.map((e) => ({
        gegenkonto: e.gegenkonto,
        betrag: parseFloat(e.betrag) || 0,
        gfNr: e.gfNr ? parseInt(e.gfNr) : undefined,
      })),
      eintraegeRechts: k.eintraegeRechts.map((e) => ({
        gegenkonto: e.gegenkonto,
        betrag: parseFloat(e.betrag) || 0,
        gfNr: e.gfNr ? parseInt(e.gfNr) : undefined,
      })),
      saldo: (k.saldoLinks || k.saldoRechts) ? {
        betragLinks: parseFloat(k.saldoLinks) || 0,
        betragRechts: parseFloat(k.saldoRechts) || 0,
      } : undefined,
    })),
  }
}

/** Initialisiert die Konten aus einer bestehenden Antwort (clean, ohne Record<string, unknown>-Casts) */
export function vonAntwort(
  antwort: TKontoAntwort | undefined,
  frageDefs: TKontoFrageType['konten'],
): KontoEingabe[] {
  return frageDefs.map((def) => {
    const eingabe = antwort?.konten.find((k) => k.id === def.id)
    if (!eingabe) return leereKontoEingabe(def.id)
    return {
      id: def.id,
      beschriftungLinks: eingabe.beschriftungLinks ?? '',
      beschriftungRechts: eingabe.beschriftungRechts ?? '',
      kontenkategorie: eingabe.kontenkategorie ?? '',
      sollHaben: eingabe.sollHaben ?? '',
      zunahmeAbnahme: eingabe.zunahmeAbnahme ?? '',
      zunahmeAbnahmeLinks: eingabe.zunahmeAbnahmeLinks ?? '',
      zunahmeAbnahmeRechts: eingabe.zunahmeAbnahmeRechts ?? '',
      anfangsbestandLinks: '',
      anfangsbestandRechts: '',
      eintraegeLinks: eingabe.eintraegeLinks.length > 0
        ? eingabe.eintraegeLinks.map((e) => ({ id: neueId(), gegenkonto: e.gegenkonto, betrag: e.betrag ? String(e.betrag) : '', gfNr: e.gfNr ? String(e.gfNr) : '' }))
        : [leereZeile()],
      eintraegeRechts: eingabe.eintraegeRechts.length > 0
        ? eingabe.eintraegeRechts.map((e) => ({ id: neueId(), gegenkonto: e.gegenkonto, betrag: e.betrag ? String(e.betrag) : '', gfNr: e.gfNr ? String(e.gfNr) : '' }))
        : [leereZeile()],
      saldoLinks: eingabe.saldo?.betragLinks ? String(eingabe.saldo.betragLinks) : '',
      saldoRechts: eingabe.saldo?.betragRechts ? String(eingabe.saldo.betragRechts) : '',
    }
  })
}

/** Greedy-Match: für jeden korrekten Eintrag einen passenden SuS-Eintrag finden (beide Felder match, Decimal-Toleranz 0.01) */
export function matcheEintraege(korrekt: SusEintrag[], sus: SusEintrag[]): EintragStatus[] {
  const genutzt = new Set<number>()
  const status: EintragStatus[] = []
  for (const k of korrekt) {
    const idx = sus.findIndex(
      (s, i) => !genutzt.has(i) && s.gegenkonto === k.gegenkonto && Math.abs(s.betrag - k.betrag) < 0.01
    )
    if (idx >= 0) {
      genutzt.add(idx)
      status.push({ art: 'korrekt', gegenkonto: k.gegenkonto, betrag: k.betrag })
    } else {
      status.push({ art: 'fehlend', gegenkonto: k.gegenkonto, betrag: k.betrag })
    }
  }
  // Nicht-genutzte SuS-Einträge sind überflüssig
  sus.forEach((s, i) => {
    if (!genutzt.has(i)) {
      status.push({ art: 'falsch', gegenkonto: s.gegenkonto, betrag: s.betrag, hinweis: 'Nicht erwartet' })
    }
  })
  return status
}

/** Pro-Konto-Bewertung als Single-Source-of-Truth (extrahiert aus heutiger TKontoLoesung) */
export function bewerteKonto(
  konto: TKontoFrageType['konten'][0],
  sus: TKontoAntwort['konten'][0] | undefined,
): KontoBewertung {
  const korrektLinks = konto.eintraege.filter((e) => e.seite === 'soll')
  const korrektRechts = konto.eintraege.filter((e) => e.seite === 'haben')
  const susLinks: SusEintrag[] = Array.isArray(sus?.eintraegeLinks) ? sus!.eintraegeLinks : []
  const susRechts: SusEintrag[] = Array.isArray(sus?.eintraegeRechts) ? sus!.eintraegeRechts : []
  const linksStatus = matcheEintraege(korrektLinks, susLinks)
  const rechtsStatus = matcheEintraege(korrektRechts, susRechts)
  const alleLinksOk = linksStatus.every((s) => s.art === 'korrekt') && linksStatus.length === korrektLinks.length
  const alleRechtsOk = rechtsStatus.every((s) => s.art === 'korrekt') && rechtsStatus.length === korrektRechts.length
  const saldoBalanciert =
    !sus?.saldo ||
    Math.abs((sus.saldo.betragLinks ?? 0) - (sus.saldo.betragRechts ?? 0)) < 0.01
  const kontoKorrekt = alleLinksOk && alleRechtsOk && saldoBalanciert
  return { linksStatus, rechtsStatus, alleLinksOk, alleRechtsOk, saldoBalanciert, kontoKorrekt }
}
