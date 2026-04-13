import { useState } from 'react'
import FeedbackButton from '../../shared/FeedbackButton.tsx'
import type { Frage } from '../../../types/fragen.ts'
import type { PruefungsKorrektur, SchuelerAbgabe, FragenBewertung } from '../../../types/korrektur.ts'
import type { NotenConfig } from '../../../types/pruefung.ts'
import type { Antwort } from '../../../types/antworten.ts'

interface Props {
  fragen: Frage[]
  korrektur: PruefungsKorrektur
  abgaben: Record<string, SchuelerAbgabe>
  notenConfig: NotenConfig
  onBewertungUpdate: (
    email: string,
    frageId: string,
    updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean }
  ) => void
  istFormativ?: boolean
}

/** Fragentyp-Label für Badge */
function typLabel(typ: string): string {
  switch (typ) {
    case 'mc': return 'MC'
    case 'freitext': return 'Freitext'
    case 'richtigfalsch': return 'R/F'
    case 'zuordnung': return 'Zuordnung'
    case 'lueckentext': return 'Lückentext'
    case 'berechnung': return 'Berechnung'
    case 'buchungssatz': return 'Buchungssatz'
    case 'tkonto': return 'T-Konto'
    case 'kontenbestimmung': return 'Kontenbestimmung'
    case 'bilanzstruktur': return 'Bilanz/ER'
    case 'visualisierung': return 'Zeichnen'
    case 'pdf': return 'PDF'
    case 'aufgabengruppe': return 'Gruppe'
    case 'sortierung': return 'Sortierung'
    case 'hotspot': return 'Hotspot'
    case 'bildbeschriftung': return 'Beschriftung'
    case 'audio': return 'Audio'
    case 'dragdrop_bild': return 'Drag&Drop'
    case 'code': return 'Code'
    case 'formel': return 'Formel'
    default: return typ
  }
}

/** Antwort als lesbaren Text darstellen */
function renderAntwort(antwort: Antwort | undefined, frage: Frage): string {
  if (!antwort) return '(keine Antwort)'

  switch (antwort.typ) {
    case 'freitext':
      return antwort.text || '(leer)'

    case 'mc':
      if (antwort.gewaehlteOptionen.length === 0) return '(keine Auswahl)'
      if (frage.typ === 'mc') {
        return antwort.gewaehlteOptionen
          .map((id) => {
            const opt = frage.optionen.find((o) => o.id === id)
            return opt ? opt.text : id
          })
          .join(', ')
      }
      return antwort.gewaehlteOptionen.join(', ')

    case 'richtigfalsch': {
      const entries = Object.entries(antwort.bewertungen)
      if (entries.length === 0) return '(keine Antwort)'
      if (frage.typ === 'richtigfalsch') {
        return entries
          .map(([id, val]) => {
            const aussage = frage.aussagen.find((a) => a.id === id)
            const label = aussage ? aussage.text.substring(0, 40) : id
            return `${label}${aussage && aussage.text.length > 40 ? '...' : ''}: ${val ? 'R' : 'F'}`
          })
          .join(' | ')
      }
      return entries.map(([id, val]) => `${id}: ${val ? 'R' : 'F'}`).join(', ')
    }

    case 'lueckentext': {
      const entries = Object.entries(antwort.eintraege)
      if (entries.length === 0) return '(leer)'
      return entries.map(([id, val]) => `[${id}]: ${val || '—'}`).join(', ')
    }

    case 'zuordnung': {
      const entries = Object.entries(antwort.zuordnungen)
      if (entries.length === 0) return '(keine Zuordnung)'
      return entries.map(([links, rechts]) => `${links} → ${rechts}`).join(', ')
    }

    case 'berechnung': {
      const entries = Object.entries(antwort.ergebnisse)
      if (entries.length === 0) return '(leer)'
      const teile = entries.map(([id, val]) => `${id}: ${val}`)
      const text = teile.join(', ')
      if (antwort.rechenweg) return `${text} | Rechenweg: ${antwort.rechenweg.substring(0, 80)}${antwort.rechenweg.length > 80 ? '...' : ''}`
      return text
    }

    case 'buchungssatz':
      if (antwort.buchungen.length === 0) return '(leer)'
      return antwort.buchungen
        .map((b) => `S: ${b.sollKonto} ${b.betrag} / H: ${b.habenKonto} ${b.betrag}`)
        .join(' | ')

    case 'tkonto':
      if (antwort.konten.length === 0) return '(leer)'
      return `${antwort.konten.length} Konto/Konten ausgefüllt`

    case 'kontenbestimmung': {
      const entries = Object.entries(antwort.aufgaben)
      if (entries.length === 0) return '(leer)'
      return `${entries.length} Aufgaben beantwortet`
    }

    case 'bilanzstruktur':
      if (antwort.bilanz || antwort.erfolgsrechnung) {
        const teile: string[] = []
        if (antwort.bilanz) teile.push('Bilanz ausgefüllt')
        if (antwort.erfolgsrechnung) teile.push('ER ausgefüllt')
        return teile.join(', ')
      }
      return '(leer)'

    case 'visualisierung':
      return '[Zeichnung]'

    case 'pdf':
      return `[PDF-Annotation] (${antwort.annotationen?.length ?? 0} Markierungen)`

    case 'code':
      return antwort.code ? `[Code] ${antwort.code.substring(0, 80)}${antwort.code.length > 80 ? '...' : ''}` : '(leer)'

    case 'formel':
      return antwort.latex ? `[LaTeX] ${antwort.latex}` : '(leer)'

    default:
      return '(unbekannter Typ)'
  }
}

/** Fragentext aus einer Frage extrahieren */
function getFragetext(frage: Frage): string {
  if ('fragetext' in frage && frage.fragetext) return frage.fragetext
  if ('geschaeftsfall' in frage && frage.geschaeftsfall) return frage.geschaeftsfall
  if ('aufgabentext' in frage && frage.aufgabentext) return frage.aufgabentext
  if ('kontext' in frage && frage.kontext) return frage.kontext
  return frage.id
}

export default function KorrekturFragenAnsicht({
  fragen,
  korrektur,
  abgaben,
  notenConfig: _notenConfig,
  onBewertungUpdate,
  istFormativ = false,
}: Props) {
  const [aktiverFrageIndex, setAktiverFrageIndex] = useState(0)
  const [aktiverSchuelerIndex, setAktiverSchuelerIndex] = useState(0)

  // Aufgabengruppen-Fragen ausfiltern (nur Teilfragen zeigen)
  const sichtbareFragen = fragen.filter((f) => f.typ !== 'aufgabengruppe')

  if (sichtbareFragen.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Keine Fragen vorhanden.
      </div>
    )
  }

  const aktiveFrage = sichtbareFragen[aktiverFrageIndex] ?? sichtbareFragen[0]
  const fragetext = getFragetext(aktiveFrage)

  // Sortierte Schüler (alphabetisch)
  const sortierteSchueler = [...korrektur.schueler].sort((a, b) => a.name.localeCompare(b.name))

  // Statistik für aktive Frage
  const gepruefte = sortierteSchueler.filter(
    (s) => s.bewertungen[aktiveFrage.id]?.geprueft
  ).length

  return (
    <div className="space-y-4">
      {/* Fragen-Navigation */}
      <div className="overflow-x-auto -mx-2 px-2 pb-1">
        <div className="flex gap-1.5 min-w-max">
          {sichtbareFragen.map((frage, index) => {
            const alleGeprueft = sortierteSchueler.every(
              (s) => s.bewertungen[frage.id]?.geprueft
            )
            return (
              <button
                key={frage.id}
                onClick={() => setAktiverFrageIndex(index)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0
                  ${index === aktiverFrageIndex
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                    : alleGeprueft
                      ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                <span className="font-semibold">{index + 1}</span>
                <span className={`text-[10px] leading-tight ${
                  index === aktiverFrageIndex
                    ? 'text-white/70 dark:text-slate-800/70'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {typLabel(frage.typ)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Frage-Header */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            Frage {aktiverFrageIndex + 1}
          </span>
          <span className="inline-block px-1.5 py-0.5 text-[10px] rounded font-medium bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300">
            {typLabel(aktiveFrage.typ)}
          </span>
          {!istFormativ && (
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            max. {aktiveFrage.punkte} Pkt.
          </span>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {gepruefte}/{sortierteSchueler.length} geprüft
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
          {fragetext}
        </p>
        <div className="mt-2">
          <FeedbackButton
            variant="link"
            label="Problem melden"
            context={{
              rolle: 'lp',
              ort: 'korrektur-frage',
              frageId: aktiveFrage.id,
              frageText: fragetext,
              frageTyp: aktiveFrage.typ,
              modus: 'pruefen',
              bildschirm: 'korrektur',
            }}
          />
        </div>
      </div>

      {/* Alle bestätigen */}
      {gepruefte < sortierteSchueler.length && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              for (const s of sortierteSchueler) {
                const bew = s.bewertungen[aktiveFrage.id]
                if (bew && !bew.geprueft) {
                  onBewertungUpdate(s.email, aktiveFrage.id, { geprueft: true })
                }
              }
            }}
            className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer"
          >
            Alle bestätigen ({sortierteSchueler.length - gepruefte} offen)
          </button>
        </div>
      )}

      {/* Aktuelle SuS-Karte (eine pro Seite, MS Forms-Stil) */}
      {sortierteSchueler.length > 0 && (() => {
        const schueler = sortierteSchueler[aktiverSchuelerIndex]
        const bewertung = schueler?.bewertungen[aktiveFrage.id]
        const antwort = abgaben[schueler?.email]?.antworten[aktiveFrage.id]

        return (
          <div className="space-y-3">
            {/* SuS-Navigation */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setAktiverSchuelerIndex((i) => Math.max(0, i - 1))}
                disabled={aktiverSchuelerIndex === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                ← Vorherige/r
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {schueler?.name} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">({aktiverSchuelerIndex + 1}/{sortierteSchueler.length})</span>
              </span>
              <button
                onClick={() => setAktiverSchuelerIndex((i) => Math.min(sortierteSchueler.length - 1, i + 1))}
                disabled={aktiverSchuelerIndex === sortierteSchueler.length - 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                Nächste/r →
              </button>
            </div>

            {/* Antwort-Karte (gross, einzeln) */}
            {schueler && bewertung && (
              <SchuelerAntwortKarte
                key={schueler.email}
                name={schueler.name}
                email={schueler.email}
                antwort={antwort}
                frage={aktiveFrage}
                bewertung={bewertung}
                istFormativ={istFormativ}
                onUpdate={(updates) => onBewertungUpdate(schueler.email, aktiveFrage.id, updates)}
              />
            )}
          </div>
        )
      })()}

      {/* Fragen-Navigation unten */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => { setAktiverFrageIndex((i) => Math.max(0, i - 1)); setAktiverSchuelerIndex(0) }}
          disabled={aktiverFrageIndex === 0}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          ← Vorherige Frage
        </button>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Frage {aktiverFrageIndex + 1} / {sichtbareFragen.length}
        </span>
        <button
          onClick={() => { setAktiverFrageIndex((i) => Math.min(sichtbareFragen.length - 1, i + 1)); setAktiverSchuelerIndex(0) }}
          disabled={aktiverFrageIndex === sichtbareFragen.length - 1}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          Nächste Frage →
        </button>
      </div>
    </div>
  )
}

// === Einzelne Schüler-Karte ===

interface SchuelerAntwortKarteProps {
  name: string
  email: string
  antwort: Antwort | undefined
  frage: Frage
  bewertung: FragenBewertung
  istFormativ?: boolean
  onUpdate: (updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean }) => void
}

function SchuelerAntwortKarte({
  name,
  antwort,
  frage,
  bewertung,
  istFormativ = false,
  onUpdate,
}: SchuelerAntwortKarteProps) {
  const punkteWert = bewertung.lpPunkte ?? bewertung.kiPunkte ?? ''

  return (
    <div className={`rounded-lg border p-3 transition-colors ${
      bewertung.geprueft
        ? 'border-green-200 bg-green-50/30 dark:border-green-800/40 dark:bg-green-900/10'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
    }`}>
      <div className="flex items-start gap-3">
        {/* Name + Antwort */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {name}
            </span>
            {bewertung.quelle === 'ki' && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                KI
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words">
            {renderAntwort(antwort, frage)}
          </p>
          {/* KI-Feedback */}
          {bewertung.kiFeedback && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">
              KI: {bewertung.kiFeedback}
            </p>
          )}
          {/* KI-Begründung */}
          {bewertung.kiBegruendung && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Begründung: {bewertung.kiBegruendung}
            </p>
          )}
        </div>

        {/* Punkte + Geprüft */}
        <div className="flex items-center gap-2 shrink-0">
          {!istFormativ && (
          <>
          {/* KI-Vorschlag Anzeige (wenn vorhanden und LP noch nicht angepasst) */}
          {bewertung.kiPunkte !== null && bewertung.lpPunkte === null && (
            <span className="text-[10px] text-amber-500 dark:text-amber-400" title="KI-Vorschlag">
              KI: {bewertung.kiPunkte}
            </span>
          )}
          <input
            type="number"
            value={punkteWert}
            onChange={(e) => {
              const val = e.target.value === '' ? null : Math.min(Math.max(0, parseFloat(e.target.value) || 0), bewertung.maxPunkte)
              onUpdate({ lpPunkte: val })
            }}
            min={0}
            max={bewertung.maxPunkte}
            step={0.5}
            className={`w-14 px-1.5 py-1 text-sm text-right border rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 tabular-nums ${punkteWert === '' ? 'border-violet-500 bg-violet-50 dark:bg-[#2d2040]' : 'border-slate-300 dark:border-slate-600'}`}
          />
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            /{bewertung.maxPunkte}
          </span>
          </>
          )}
          <label className="flex items-center gap-1 cursor-pointer" title="Geprüft">
            <input
              type="checkbox"
              checked={bewertung.geprueft}
              onChange={(e) => onUpdate({ geprueft: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <span className={`text-xs ${bewertung.geprueft ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
              ✓
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
