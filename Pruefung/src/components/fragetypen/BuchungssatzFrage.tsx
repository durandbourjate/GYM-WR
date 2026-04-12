import { useState, useEffect } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { BuchungssatzFrage as BuchungssatzFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import KontenSelect from '../shared/KontenSelect.tsx'

interface Props {
  frage: BuchungssatzFrageType
}

/** U2: Vereinfachter Buchungssatz — "Soll-Konto an Haben-Konto Betrag" */

interface BuchungEingabe {
  id: string
  sollKonto: string
  habenKonto: string
  betrag: string
}

function neueId(): string {
  return crypto.randomUUID()
}

function leereBuchung(): BuchungEingabe {
  return { id: neueId(), sollKonto: '', habenKonto: '', betrag: '' }
}

/** Konvertiert die interne Eingabe ins Antwort-Format für den Store */
function zuAntwort(buchungen: BuchungEingabe[]) {
  return {
    typ: 'buchungssatz' as const,
    buchungen: buchungen.map((b) => ({
      id: b.id,
      sollKonto: b.sollKonto,
      habenKonto: b.habenKonto,
      betrag: parseFloat(b.betrag) || 0,
    })),
  }
}

/** Initialisiert die Buchungen aus einer bestehenden Antwort */
function vonAntwort(
  antwort: {
    typ: 'buchungssatz'
    buchungen: { id: string; sollKonto: string; habenKonto: string; betrag: number }[]
  } | undefined
): BuchungEingabe[] {
  if (!antwort || antwort.buchungen.length === 0) return [leereBuchung()]
  return antwort.buchungen.map((b) => ({
    id: b.id,
    sollKonto: b.sollKonto,
    habenKonto: b.habenKonto,
    betrag: b.betrag ? String(b.betrag) : '',
  }))
}

export default function BuchungssatzFrage({ frage }: Props) {
  const { antwort, onAntwort, speichereZwischenstand, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const gespeicherteAntwort =
    antwort?.typ === 'buchungssatz' ? antwort : undefined

  const [buchungen, setBuchungenLokal] = useState<BuchungEingabe[]>(() =>
    vonAntwort(gespeicherteAntwort)
  )

  // Bei Fragenwechsel: State neu initialisieren
  useEffect(() => {
    const gespeichert = antwort?.typ === 'buchungssatz' ? antwort : undefined
    setBuchungenLokal(vonAntwort(gespeichert))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  function aktualisiere(neueBuchungen: BuchungEingabe[]) {
    setBuchungenLokal(neueBuchungen)
    // Im Üben-Modus nur Zwischenstand speichern (ohne Korrektur), im Prüfungsmodus direkt speichern
    if (speichereZwischenstand) {
      speichereZwischenstand(zuAntwort(neueBuchungen))
    } else {
      onAntwort(zuAntwort(neueBuchungen))
    }
  }

  /** Explizite Abgabe im Üben-Modus (mit Korrektur) */
  function antwortPruefen() {
    onAntwort(zuAntwort(buchungen))
  }

  function feldAendern(buchungIdx: number, feld: keyof BuchungEingabe, wert: string) {
    const kopie = buchungen.map((b) => ({ ...b }))
    kopie[buchungIdx] = { ...kopie[buchungIdx], [feld]: wert }
    aktualisiere(kopie)
  }

  function buchungHinzufuegen() {
    aktualisiere([...buchungen, leereBuchung()])
  }

  function buchungEntfernen(buchungIdx: number) {
    if (buchungen.length <= 1) return
    aktualisiere(buchungen.filter((_, i) => i !== buchungIdx))
  }

  const readOnly = disabled

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          Buchungssatz
        </span>
      </div>

      {/* Geschäftsfall */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.geschaeftsfall) }}
      />

      {/* Buchungssätze */}
      <div className="flex flex-col gap-4">
        {buchungen.map((buchung, bIdx) => (
          <div
            key={buchung.id}
            className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
          >
            {/* Buchungssatz-Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Buchungssatz {bIdx + 1}
              </span>
              {!readOnly && buchungen.length > 1 && (
                <button
                  type="button"
                  onClick={() => buchungEntfernen(bIdx)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Soll-Konto "an" Haben-Konto Betrag — inline */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Soll-Konto */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Soll</label>
                <KontenSelect
                  value={buchung.sollKonto}
                  onChange={(nr) => feldAendern(bIdx, 'sollKonto', nr)}
                  config={frage.kontenauswahl}
                  placeholder="Soll-Konto..."
                  disabled={readOnly}
                />
              </div>

              {/* "an" */}
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 self-end pb-2.5">
                an
              </span>

              {/* Haben-Konto */}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Haben</label>
                <KontenSelect
                  value={buchung.habenKonto}
                  onChange={(nr) => feldAendern(bIdx, 'habenKonto', nr)}
                  config={frage.kontenauswahl}
                  placeholder="Haben-Konto..."
                  disabled={readOnly}
                />
              </div>

              {/* Betrag */}
              <div className="w-28 shrink-0">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Betrag</label>
                <input
                  type="number"
                  value={buchung.betrag}
                  onChange={(e) => feldAendern(bIdx, 'betrag', e.target.value)}
                  disabled={readOnly}
                  placeholder="CHF"
                  min="0"
                  step="0.01"
                  className={`min-h-[44px] w-full rounded-md border bg-white px-3 py-2
                    text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100
                    focus:outline-none focus:ring-1 focus:ring-slate-400
                    disabled:cursor-not-allowed disabled:opacity-50
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    ${!readOnly && !buchung.betrag ? 'border-violet-400 dark:border-violet-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Buchungssatz hinzufügen */}
      {!readOnly && (
        <button
          type="button"
          onClick={buchungHinzufuegen}
          className="min-h-[44px] self-start flex items-center gap-2 rounded-lg border-2 border-dashed
            border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium
            text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500
            hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buchungssatz hinzufügen
        </button>
      )}

      {/* Prüfen-Button (nur Üben-Modus, wenn noch nicht beantwortet) */}
      {speichereZwischenstand && !disabled && (
        <button
          type="button"
          onClick={antwortPruefen}
          className="min-h-[48px] self-end px-6 py-2.5 rounded-xl bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 font-medium text-sm hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          Antwort prüfen
        </button>
      )}

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '✓ Richtig!' : '✗ Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
