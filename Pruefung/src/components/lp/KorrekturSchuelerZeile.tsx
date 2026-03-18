import { useState } from 'react'
import type { SchuelerKorrektur, SchuelerAbgabe } from '../../types/korrektur.ts'
import type { Frage } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { effektivePunkte, berechneNote, statusLabel, statusFarbe } from '../../utils/korrekturUtils.ts'
import KorrekturFrageZeile from './KorrekturFrageZeile.tsx'

interface Props {
  schueler: SchuelerKorrektur
  abgabe: SchuelerAbgabe | undefined
  fragen: Frage[]
  onBewertungUpdate: (
    schuelerEmail: string,
    frageId: string,
    updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean }
  ) => void
}

/** Wandelt eine Antwort in lesbaren Text um */
function antwortAlsText(antwort: Antwort | undefined, frage: Frage): string {
  if (!antwort) return '(keine Antwort)'

  switch (antwort.typ) {
    case 'mc':
      if (antwort.gewaehlteOptionen.length === 0) return '(keine Auswahl)'
      if (frage.typ === 'mc') {
        return antwort.gewaehlteOptionen
          .map((id) => frage.optionen.find((o) => o.id === id)?.text ?? id)
          .join(', ')
      }
      return antwort.gewaehlteOptionen.join(', ')

    case 'freitext':
      return antwort.text || '(leer)'

    case 'zuordnung': {
      const paare = Object.entries(antwort.zuordnungen)
      if (paare.length === 0) return '(keine Zuordnung)'
      return paare.map(([links, rechts]) => `${links} → ${rechts}`).join(', ')
    }

    case 'lueckentext': {
      const eintraege = Object.entries(antwort.eintraege)
      if (eintraege.length === 0) return '(keine Einträge)'
      return eintraege
        .sort(([a], [b]) => a.localeCompare(b, 'de', { numeric: true }))
        .map(([_id, text], i) => `Lücke ${i + 1}: ${text || '–'}`)
        .join(', ')
    }

    case 'richtigfalsch': {
      const bewertungen = Object.entries(antwort.bewertungen)
      if (bewertungen.length === 0) return '(keine Angaben)'
      return bewertungen
        .sort(([a], [b]) => a.localeCompare(b, 'de', { numeric: true }))
        .map(([_id, wert], i) => `Aussage ${i + 1}: ${wert ? 'R' : 'F'}`)
        .join(', ')
    }

    case 'berechnung': {
      const ergebnisse = Object.entries(antwort.ergebnisse)
      if (ergebnisse.length === 0 && !antwort.rechenweg) return '(keine Angaben)'
      const teile = ergebnisse
        .sort(([a], [b]) => a.localeCompare(b, 'de', { numeric: true }))
        .map(([_id, wert], i) => `Ergebnis ${i + 1}: ${wert || '–'}`)
      if (antwort.rechenweg) teile.push(`Rechenweg: ${antwort.rechenweg}`)
      return teile.join(', ')
    }

    default:
      return '(unbekannter Typ)'
  }
}

export default function KorrekturSchuelerZeile({ schueler, abgabe, fragen, onBewertungUpdate }: Props) {
  const [offen, setOffen] = useState(false)

  // Aggregierte Werte
  const bewertungenListe = Object.values(schueler.bewertungen)
  const totalPunkte = bewertungenListe.reduce((s, b) => s + effektivePunkte(b), 0)
  const totalMax = bewertungenListe.reduce((s, b) => s + b.maxPunkte, 0)
  const note = berechneNote(totalPunkte, totalMax)
  const geprueftCount = bewertungenListe.filter((b) => b.geprueft).length
  const totalCount = bewertungenListe.length
  const alleGeprueft = totalCount > 0 && geprueftCount === totalCount

  const handleAlleBestaetigen = () => {
    for (const bew of bewertungenListe) {
      if (!bew.geprueft) {
        onBewertungUpdate(schueler.email, bew.frageId, { geprueft: true })
      }
    }
  }

  return (
    <div className={`border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${
      alleGeprueft ? 'bg-green-50/40 dark:bg-green-900/5' : ''
    }`}>
      {/* Kopfzeile (klickbar) */}
      <button
        onClick={() => setOffen(!offen)}
        className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1fr_auto] gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-left items-center"
      >
        {/* Name + Klasse */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-400 dark:text-slate-500 text-xs w-4 shrink-0">
            {offen ? '▼' : '▶'}
          </span>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {schueler.name}
          </span>
          {schueler.klasse && (
            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
              {schueler.klasse}
            </span>
          )}
        </div>

        {/* Punkte + Note */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {totalPunkte} / {totalMax}
          </span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {note.toFixed(1)}
          </span>
        </div>

        {/* Status + Geprüft-Zähler */}
        <div className="flex items-center gap-2 justify-end md:justify-start">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusFarbe(schueler.korrekturStatus)}`}>
            {statusLabel(schueler.korrekturStatus)}
          </span>
          <span className={`text-xs ${
            alleGeprueft
              ? 'text-green-600 dark:text-green-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}>
            {geprueftCount}/{totalCount} ✓
          </span>
        </div>

        {/* Punkte + Note (Mobile, rechts oben) */}
        <div className="md:hidden text-right">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {totalPunkte}/{totalMax}
          </span>
          <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
            ({note.toFixed(1)})
          </span>
        </div>
      </button>

      {/* Aufgeklappter Bereich */}
      {offen && (
        <div className="px-4 pb-3 space-y-1">
          {fragen.map((frage) => {
            const bewertung = schueler.bewertungen[frage.id]
            const antwort = abgabe?.antworten[frage.id]
            const antwortText = antwortAlsText(antwort, frage)

            return bewertung ? (
              <KorrekturFrageZeile
                key={frage.id}
                frageId={frage.id}
                fragetext={(frage as { fragetext?: string }).fragetext ?? frage.id}
                fragenTyp={frage.typ}
                bewertung={bewertung}
                antwortText={antwortText}
                onUpdate={(updates) => onBewertungUpdate(schueler.email, frage.id, updates)}
              />
            ) : null
          })}

          {/* Alle bestätigen */}
          {!alleGeprueft && totalCount > 0 && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleAlleBestaetigen}
                className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer"
              >
                Alle bestätigen ({totalCount - geprueftCount} offen)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
