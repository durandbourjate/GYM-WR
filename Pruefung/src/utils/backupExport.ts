import type { PruefungsConfig } from '../types/pruefung'
import type { Frage } from '../types/fragen'
import type { SchuelerAbgabe, PruefungsKorrektur, FragenBewertung } from '../types/korrektur'
import { antwortAlsText } from './exportUtils'

export interface BackupExportInput {
  config: PruefungsConfig
  fragen: Frage[]
  abgaben: Record<string, SchuelerAbgabe>
  korrektur?: PruefungsKorrektur
}

/** Effektive Punkte: LP-Override hat Vorrang, sonst KI */
function effektivePunkte(b?: FragenBewertung): number | string {
  if (!b) return ''
  return b.lpPunkte ?? b.kiPunkte ?? ''
}

/** Effektiver Kommentar: LP-Override hat Vorrang, sonst KI-Feedback */
function effektiverKommentar(b?: FragenBewertung): string {
  if (!b) return ''
  return b.lpKommentar || b.kiFeedback || ''
}

/** Fragetext bereinigen (HTML entfernen, kürzen) */
function bereinigterFragetext(frage: Frage, maxLen = 200): string {
  const raw = 'fragetext' in frage && typeof frage.fragetext === 'string'
    ? frage.fragetext
    : frage.id
  const clean = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean
}

/** Excel-Tab-Name bereinigen (max 31 Zeichen, ungültige Zeichen entfernen) */
function sichererTabName(name: string, benutzte: Set<string>): string {
  let clean = name.replace(/[[\]:*?/\\]/g, '').trim().slice(0, 31)
  if (!clean) clean = 'Unbekannt'
  let result = clean
  let counter = 2
  while (benutzte.has(result)) {
    result = clean.slice(0, 28) + ` (${counter})`
    counter++
  }
  benutzte.add(result)
  return result
}

/** Bewertungen eines SuS aus Korrektur-Daten holen */
function findeBewertungen(
  email: string,
  korrektur?: PruefungsKorrektur
): Record<string, FragenBewertung> {
  if (!korrektur) return {}
  const sk = korrektur.schueler.find(s => s.email === email)
  return sk?.bewertungen ?? {}
}

export async function exportiereBackupXlsx(input: BackupExportInput): Promise<void> {
  const XLSX = await import('xlsx')
  const { config, fragen, abgaben, korrektur } = input

  const wb = XLSX.utils.book_new()
  const benutzteTabs = new Set<string>()
  benutzteTabs.add('Übersicht')

  // Alle SuS sammeln (aus abgaben + korrektur)
  const alleEmails = new Set<string>()
  Object.keys(abgaben).forEach(e => alleEmails.add(e))
  korrektur?.schueler.forEach(s => alleEmails.add(s.email))
  const emailListe = Array.from(alleEmails).sort()

  // === Tab 1: Übersicht ===
  const headerRow: (string | number)[] = [
    'Name', 'E-Mail', 'Klasse', 'Total', 'Max', 'Note',
    ...fragen.flatMap((_f, i) => [`F${i + 1} Pkt`, `F${i + 1} Kommentar`])
  ]
  const uebersichtDaten: (string | number)[][] = [headerRow]

  for (const email of emailListe) {
    const abgabe = abgaben[email]
    const sk = korrektur?.schueler.find(s => s.email === email)
    const bewertungen = findeBewertungen(email, korrektur)
    const name = sk?.name || abgabe?.name || email
    const klasse = sk?.klasse || ''

    const total = sk ? sk.gesamtPunkte : ''
    const max = sk ? sk.maxPunkte : ''
    const note = sk?.noteOverride ?? sk?.note ?? ''

    const fragenDaten = fragen.flatMap(f => {
      const b = bewertungen[f.id]
      return [effektivePunkte(b), effektiverKommentar(b)]
    })

    uebersichtDaten.push([name, email, klasse, total, max, note, ...fragenDaten])
  }

  const wsUebersicht = XLSX.utils.aoa_to_sheet(uebersichtDaten)
  XLSX.utils.book_append_sheet(wb, wsUebersicht, 'Übersicht')

  // === Tabs pro SuS ===
  for (const email of emailListe) {
    const abgabe = abgaben[email]
    const sk = korrektur?.schueler.find(s => s.email === email)
    const bewertungen = findeBewertungen(email, korrektur)
    const name = sk?.name || abgabe?.name || email
    const tabName = sichererTabName(name, benutzteTabs)

    const rows: (string | number)[][] = [
      ['#', 'Frage', 'Typ', 'Antwort', 'Punkte', 'Max', 'Kommentar']
    ]

    fragen.forEach((frage, idx) => {
      const antwort = abgabe?.antworten?.[frage.id]
      const b = bewertungen[frage.id]
      rows.push([
        idx + 1,
        bereinigterFragetext(frage),
        frage.typ,
        antwort ? antwortAlsText(antwort, frage) : (abgabe ? '(leer)' : 'Keine Abgabe'),
        effektivePunkte(b),
        frage.punkte,
        effektiverKommentar(b),
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, tabName)
  }

  // === Download ===
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const titel = (config.titel || config.id || 'Pruefung').replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')
  a.href = url
  a.download = `${titel}_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
