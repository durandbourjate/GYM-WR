import { useState } from 'react'
import type { FragenBewertung, KriteriumBewertung } from '../../../types/korrektur.ts'
import type { Frage, FreitextFrage } from '../../../types/fragen.ts'
import type { Antwort } from '../../../types/antworten.ts'
import type { KorrekturErgebnis } from '../../../utils/autoKorrektur.ts'
import { effektivePunkte, quelleLabel } from '../../../utils/korrekturUtils.ts'
import { apiService } from '../../../services/apiService.ts'
import AudioRecorder from '../../AudioRecorder.tsx'
import KorrekturFrageVollansicht from './KorrekturFrageVollansicht.tsx'

/** KI-korrigierbare Fragetypen (nicht-deterministische, brauchen Claude API) */
const KI_KORRIGIERBARE_TYPEN = new Set(['freitext'])

interface Props {
  frageId: string
  frage: Frage
  antwort: Antwort | undefined
  autoErgebnis: KorrekturErgebnis | null
  bewertung: FragenBewertung
  /** Aufgabennummer (1-basiert) für Anzeige (U6) */
  aufgabeNr?: number
  /** E-Mail der LP (für API-Key-Routing bei KI-Korrektur) */
  userEmail?: string
  /** Bei formativen Übungen: keine Punktevergabe anzeigen */
  istFormativ?: boolean
  onUpdate: (updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null; kiPunkte?: number | null; kiBegruendung?: string | null; quelle?: 'auto' | 'ki' | 'manuell' | 'fehler'; kriterienBewertung?: KriteriumBewertung[] | null }) => void
  onAudioUpload: (frageId: string, blob: Blob) => Promise<string | null>
}

/** Farbe für Quelle-Badge */
function quelleFarbe(quelle: FragenBewertung['quelle']): string {
  switch (quelle) {
    case 'auto': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    case 'ki': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'manuell': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'fehler': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }
}

/** Farbe für Fragentyp-Badge */
function fragenTypFarbe(typ: string): string {
  switch (typ) {
    case 'mc':
    case 'richtigfalsch':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    case 'freitext':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }
}

export default function KorrekturFrageZeile({
  frageId,
  frage,
  antwort,
  autoErgebnis,
  bewertung,
  aufgabeNr,
  userEmail,
  istFormativ = false,
  onUpdate,
  onAudioUpload,
}: Props) {
  const [kiLaedt, setKiLaedt] = useState(false)
  const aktuellePunkte = effektivePunkte(bewertung)
  const hatKiErgebnis = bewertung.quelle === 'ki' || bewertung.quelle === 'auto'
  const fragenTyp = frage.typ

  // KI-Vorschlag für Freitext anfordern
  const handleKiVorschlag = async () => {
    if (kiLaedt || !antwort || !userEmail) return
    setKiLaedt(true)
    try {
      const ftFrage = frage as FreitextFrage
      const antwortText = 'text' in antwort ? (antwort as { text: string }).text : ''
      const result = await apiService.kiAssistent(userEmail, 'korrigiereFreitext', {
        fragetext: ftFrage.fragetext || '',
        antwortText,
        musterlosung: frage.musterlosung || '',
        maxPunkte: frage.punkte,
        bloom: frage.bloom || '',
        bewertungsraster: frage.bewertungsraster || [],
        lernziel: frage.lehrplanziel || '',
      })
      const ergebnis = result?.ergebnis as { punkte?: number; begruendung?: string; kriterienBewertung?: Array<{ kriterium: string; punkte: number; maxPunkte: number; kurzbegruendung?: string }> } | undefined
      if (ergebnis) {
        const updates: Parameters<typeof onUpdate>[0] = {
          kiPunkte: ergebnis.punkte ?? null,
          kiBegruendung: ergebnis.begruendung || null,
          quelle: 'ki' as const,
        }
        // Kriterienbasierte Bewertung übernehmen (wenn vorhanden)
        if (ergebnis.kriterienBewertung && Array.isArray(ergebnis.kriterienBewertung)) {
          updates.kriterienBewertung = ergebnis.kriterienBewertung.map(kb => ({
            kriterium: kb.kriterium,
            maxPunkte: kb.maxPunkte,
            kiPunkte: kb.punkte ?? null,
            lpPunkte: null,
            kurzbegruendung: kb.kurzbegruendung,
          }))
        }
        onUpdate(updates)
      }
    } catch (err) {
      console.error('[KI-Vorschlag] Fehler:', err)
    } finally {
      setKiLaedt(false)
    }
  }

  // Wert im Eingabefeld: LP-Anpassung > KI-Vorschlag > leer
  const punkteWert = bewertung.lpPunkte ?? bewertung.kiPunkte ?? ''

  return (
    <div className={`rounded-lg border p-4 transition-colors ${
      bewertung.geprueft
        ? 'border-green-200 bg-green-50/30 dark:border-green-800/40 dark:bg-green-900/10'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
    }`}>
      {/* Zeile 1: Aufgabennummer, Typ, Quelle, Max-Punkte (U6) */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {aufgabeNr !== undefined && (
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Aufgabe {aufgabeNr}
          </span>
        )}
        <span className={`inline-block px-1.5 py-0.5 text-xs rounded font-medium ${fragenTypFarbe(fragenTyp)}`}>
          {fragenTyp}
        </span>
        <span className={`inline-block px-1.5 py-0.5 text-xs rounded font-medium ${quelleFarbe(bewertung.quelle)}`}>
          {quelleLabel(bewertung.quelle)}
        </span>
        {!istFormativ && (
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            max. {bewertung.maxPunkte} Pkt.
          </span>
        )}
      </div>

      {/* Vollansicht: Frage + Antwort + Auto-Korrektur + Musterlösung */}
      <div className="mb-3">
        <KorrekturFrageVollansicht frage={frage} antwort={antwort} autoErgebnis={autoErgebnis} />
      </div>

      {/* KI-Vorschlag-Button für Freitext (wenn noch kein KI-Ergebnis) */}
      {KI_KORRIGIERBARE_TYPEN.has(fragenTyp) && !hatKiErgebnis && antwort && (
        <div className="mb-3">
          <button
            onClick={handleKiVorschlag}
            disabled={kiLaedt}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            {kiLaedt ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-1.5 align-text-bottom" />
                KI bewertet...
              </>
            ) : (
              'KI-Vorschlag'
            )}
          </button>
        </div>
      )}

      {/* KI-Ergebnis (nur bei ki/auto) */}
      {hatKiErgebnis && bewertung.kiPunkte !== null && (
        <div className="mb-3 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">
              {quelleLabel(bewertung.quelle)}: {bewertung.kiPunkte}/{bewertung.maxPunkte} Pkt.
            </span>
            {bewertung.kiBegruendung && (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic truncate">
                {bewertung.kiBegruendung}
              </span>
            )}
          </div>

          {/* Kriterienbasierte Detailbewertung */}
          {bewertung.kriterienBewertung && bewertung.kriterienBewertung.length > 0 && (
            <div className="mt-1.5 rounded border border-slate-200 dark:border-slate-600 overflow-hidden">
              <div className="px-3 py-1 bg-slate-50 dark:bg-slate-700/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                Bewertung pro Kriterium
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {bewertung.kriterienBewertung.map((kb, idx) => (
                  <div key={idx} className="flex items-start gap-2 px-3 py-1.5">
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 min-w-0">
                      {kb.kriterium}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums shrink-0 ${
                      (kb.lpPunkte ?? kb.kiPunkte ?? 0) === kb.maxPunkte
                        ? 'text-green-600 dark:text-green-400'
                        : (kb.lpPunkte ?? kb.kiPunkte ?? 0) === 0
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {kb.lpPunkte ?? kb.kiPunkte ?? 0}/{kb.maxPunkte}
                    </span>
                    {kb.kurzbegruendung && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic max-w-[50%] truncate shrink-0" title={kb.kurzbegruendung}>
                        {kb.kurzbegruendung}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bewertung.kiFeedback && (
            <div className="rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/50 dark:border-amber-700/30 px-3 py-1.5">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {bewertung.kiFeedback}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Kommentar */}
      <div className="mt-2">
        <textarea
          rows={2}
          value={bewertung.lpKommentar ?? ''}
          placeholder="Kommentar für SuS..."
          onChange={(e) => {
            const wert = e.target.value || null
            // Auto-Geprüft nur wenn auch Punkte vorhanden (B54)
            const hatPunkte = bewertung.lpPunkte !== null || bewertung.kiPunkte !== null
            onUpdate({ lpKommentar: wert, ...(wert && hatPunkte ? { geprueft: true } : {}) })
          }}
          className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 resize-none"
        />
      </div>

      {/* Bewertungszeile: Punkte | = X Pkt. | 🎤 Audio | ☑ Geprüft */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        {/* Punkte-Eingabe (nicht bei formativen Übungen) */}
        {!istFormativ && (
        <div className="flex items-center gap-1.5">
          <label htmlFor={`punkte-${frageId}`} className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Punkte:
          </label>
          <input
            id={`punkte-${frageId}`}
            type="number"
            min={0}
            max={bewertung.maxPunkte}
            step={0.5}
            value={punkteWert}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onUpdate({ lpPunkte: null })
              } else {
                const val = parseFloat(raw)
                if (!isNaN(val) && val >= 0 && val <= bewertung.maxPunkte) {
                  // Auto-Geprüft bei Punkte-Änderung
                  onUpdate({ lpPunkte: val, geprueft: true })
                }
              }
            }}
            className={`w-16 rounded border bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-800 dark:text-slate-100 tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-violet-500 ${punkteWert === '' ? 'border-violet-500 bg-violet-50 dark:bg-[#2d2040]' : 'border-slate-300 dark:border-slate-600'}`}
          />
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            / {bewertung.maxPunkte}
          </span>
        </div>
        )}

        {/* Effektive Punkte Anzeige (nicht bei formativen Übungen) */}
        {!istFormativ && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">=</span>
          <span className={`text-sm font-semibold tabular-nums ${
            aktuellePunkte === bewertung.maxPunkte
              ? 'text-green-600 dark:text-green-400'
              : aktuellePunkte === 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-700 dark:text-slate-200'
          }`}>
            {aktuellePunkte} Pkt.
          </span>
        </div>
        )}

        {/* Audio + Geprüft (rechts, zusammen) */}
        <div className="flex items-center gap-2 ml-auto">
          <AudioRecorder
            bestehendeAudioId={bewertung.audioKommentarId}
            kompakt
            onSpeichern={async (blob) => {
              const driveId = await onAudioUpload(frageId, blob)
              if (driveId) {
                // Auto-Geprüft bei Audio-Kommentar
                onUpdate({ audioKommentarId: driveId, geprueft: true })
              }
            }}
          />
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bewertung.geprueft}
              onChange={(e) => onUpdate({ geprueft: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 dark:bg-slate-700 cursor-pointer"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">Geprüft</span>
          </label>
        </div>
      </div>
    </div>
  )
}
