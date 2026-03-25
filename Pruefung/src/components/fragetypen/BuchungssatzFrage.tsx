import { useState, useEffect } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { BuchungssatzFrage as BuchungssatzFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachbereich.ts'
import KontenSelect from '../shared/KontenSelect.tsx'

interface Props {
  frage: BuchungssatzFrageType
}

/** Erzeugt eine zufällige ID für neue Buchungssätze/Zeilen */
function neueId(): string {
  return crypto.randomUUID()
}

interface KontoZeile {
  id: string
  kontonummer: string
  betrag: string
}

interface BuchungEingabe {
  id: string
  sollKonten: KontoZeile[]
  habenKonten: KontoZeile[]
  buchungstext: string
}

function leereKontoZeile(): KontoZeile {
  return { id: neueId(), kontonummer: '', betrag: '' }
}

function leereBuchung(): BuchungEingabe {
  return {
    id: neueId(),
    sollKonten: [leereKontoZeile()],
    habenKonten: [leereKontoZeile()],
    buchungstext: '',
  }
}

/** Konvertiert die interne Eingabe ins Antwort-Format für den Store */
function zuAntwort(buchungen: BuchungEingabe[]) {
  return {
    typ: 'buchungssatz' as const,
    buchungen: buchungen.map((b) => ({
      id: b.id,
      sollKonten: b.sollKonten.map((z) => ({
        kontonummer: z.kontonummer,
        betrag: parseFloat(z.betrag) || 0,
      })),
      habenKonten: b.habenKonten.map((z) => ({
        kontonummer: z.kontonummer,
        betrag: parseFloat(z.betrag) || 0,
      })),
      buchungstext: b.buchungstext || undefined,
    })),
  }
}

/** Initialisiert die Buchungen aus einer bestehenden Antwort */
function vonAntwort(
  antwort: {
    typ: 'buchungssatz'
    buchungen: {
      id: string
      sollKonten: { kontonummer: string; betrag: number }[]
      habenKonten: { kontonummer: string; betrag: number }[]
      buchungstext?: string
    }[]
  } | undefined
): BuchungEingabe[] {
  if (!antwort || antwort.buchungen.length === 0) return [leereBuchung()]
  return antwort.buchungen.map((b) => ({
    id: b.id,
    sollKonten: b.sollKonten.length > 0
      ? b.sollKonten.map((z) => ({
          id: neueId(),
          kontonummer: z.kontonummer,
          betrag: z.betrag ? String(z.betrag) : '',
        }))
      : [leereKontoZeile()],
    habenKonten: b.habenKonten.length > 0
      ? b.habenKonten.map((z) => ({
          id: neueId(),
          kontonummer: z.kontonummer,
          betrag: z.betrag ? String(z.betrag) : '',
        }))
      : [leereKontoZeile()],
    buchungstext: b.buchungstext ?? '',
  }))
}

export default function BuchungssatzFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)

  const aktuelleAntwort = antworten[frage.id]
  const gespeicherteAntwort =
    aktuelleAntwort?.typ === 'buchungssatz' ? aktuelleAntwort : undefined

  // Lokaler State statt Neuberechnung bei jedem Render (verhindert Cursor-Sprung bei Inputs)
  const [buchungen, setBuchungenLokal] = useState<BuchungEingabe[]>(() =>
    vonAntwort(gespeicherteAntwort)
  )

  // Bei Fragenwechsel: State neu initialisieren
  useEffect(() => {
    const a = antworten[frage.id]
    const gespeichert = a?.typ === 'buchungssatz' ? a : undefined
    setBuchungenLokal(vonAntwort(gespeichert))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  function aktualisiere(neueBuchungen: BuchungEingabe[]) {
    setBuchungenLokal(neueBuchungen)
    setAntwort(frage.id, zuAntwort(neueBuchungen))
  }

  function kontoAendern(
    buchungIdx: number,
    seite: 'soll' | 'haben',
    zeileIdx: number,
    feld: 'kontonummer' | 'betrag',
    wert: string
  ) {
    const kopie = buchungen.map((b) => ({
      ...b,
      sollKonten: b.sollKonten.map((z) => ({ ...z })),
      habenKonten: b.habenKonten.map((z) => ({ ...z })),
    }))
    const zeilen = seite === 'soll' ? kopie[buchungIdx].sollKonten : kopie[buchungIdx].habenKonten
    zeilen[zeileIdx] = { ...zeilen[zeileIdx], [feld]: wert }
    aktualisiere(kopie)
  }

  function buchungstextAendern(buchungIdx: number, text: string) {
    const kopie = buchungen.map((b) => ({
      ...b,
      sollKonten: b.sollKonten.map((z) => ({ ...z })),
      habenKonten: b.habenKonten.map((z) => ({ ...z })),
    }))
    kopie[buchungIdx] = { ...kopie[buchungIdx], buchungstext: text }
    aktualisiere(kopie)
  }

  function zeileHinzufuegen(buchungIdx: number, seite: 'soll' | 'haben') {
    const kopie = buchungen.map((b) => ({
      ...b,
      sollKonten: b.sollKonten.map((z) => ({ ...z })),
      habenKonten: b.habenKonten.map((z) => ({ ...z })),
    }))
    const zeilen = seite === 'soll' ? kopie[buchungIdx].sollKonten : kopie[buchungIdx].habenKonten
    zeilen.push(leereKontoZeile())
    aktualisiere(kopie)
  }

  function zeileEntfernen(buchungIdx: number, seite: 'soll' | 'haben', zeileIdx: number) {
    const kopie = buchungen.map((b) => ({
      ...b,
      sollKonten: b.sollKonten.map((z) => ({ ...z })),
      habenKonten: b.habenKonten.map((z) => ({ ...z })),
    }))
    const zeilen = seite === 'soll' ? kopie[buchungIdx].sollKonten : kopie[buchungIdx].habenKonten
    if (zeilen.length <= 1) return // Mindestens eine Zeile behalten
    zeilen.splice(zeileIdx, 1)
    aktualisiere(kopie)
  }

  function buchungHinzufuegen() {
    aktualisiere([...buchungen, leereBuchung()])
  }

  function buchungEntfernen(buchungIdx: number) {
    if (buchungen.length <= 1) return
    const kopie = buchungen.filter((_, i) => i !== buchungIdx)
    aktualisiere(kopie)
  }

  const readOnly = abgegeben

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

      {/* Geschäftsfall (sticky) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-14 z-10"
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
                  title="Buchungssatz entfernen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Soll/Haben Tabelle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Soll-Seite */}
              <KontoSeite
                label="Soll"
                zeilen={buchung.sollKonten}
                kontenauswahl={frage.kontenauswahl}
                readOnly={readOnly}
                onKontoChange={(zIdx, nr) => kontoAendern(bIdx, 'soll', zIdx, 'kontonummer', nr)}
                onBetragChange={(zIdx, val) => kontoAendern(bIdx, 'soll', zIdx, 'betrag', val)}
                onZeileHinzufuegen={() => zeileHinzufuegen(bIdx, 'soll')}
                onZeileEntfernen={(zIdx) => zeileEntfernen(bIdx, 'soll', zIdx)}
              />

              {/* Haben-Seite */}
              <KontoSeite
                label="Haben"
                zeilen={buchung.habenKonten}
                kontenauswahl={frage.kontenauswahl}
                readOnly={readOnly}
                onKontoChange={(zIdx, nr) => kontoAendern(bIdx, 'haben', zIdx, 'kontonummer', nr)}
                onBetragChange={(zIdx, val) => kontoAendern(bIdx, 'haben', zIdx, 'betrag', val)}
                onZeileHinzufuegen={() => zeileHinzufuegen(bIdx, 'haben')}
                onZeileEntfernen={(zIdx) => zeileEntfernen(bIdx, 'haben', zIdx)}
              />
            </div>

            {/* Buchungstext */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Buchungstext (optional)
              </label>
              <input
                type="text"
                value={buchung.buchungstext}
                onChange={(e) => buchungstextAendern(bIdx, e.target.value)}
                disabled={readOnly}
                placeholder="z.B. Wareneinkauf auf Kredit"
                className="min-h-[44px] w-full rounded-md border border-slate-300 bg-white px-3 py-2
                  text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100
                  focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
                  disabled:cursor-not-allowed disabled:opacity-50
                  placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
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
          Buchungssatz hinzufuegen
        </button>
      )}
    </div>
  )
}

/* ─── Soll/Haben-Seite (wiederverwendbar) ─── */

interface KontoSeiteProps {
  label: string
  zeilen: KontoZeile[]
  kontenauswahl: BuchungssatzFrageType['kontenauswahl']
  readOnly: boolean
  onKontoChange: (zeileIdx: number, kontonummer: string) => void
  onBetragChange: (zeileIdx: number, betrag: string) => void
  onZeileHinzufuegen: () => void
  onZeileEntfernen: (zeileIdx: number) => void
}

function KontoSeite({
  label,
  zeilen,
  kontenauswahl,
  readOnly,
  onKontoChange,
  onBetragChange,
  onZeileHinzufuegen,
  onZeileEntfernen,
}: KontoSeiteProps) {
  // Neutral: keine farbliche Vorwegnahme der Kontenart
  const hatEingabe = zeilen.some(z => z.kontonummer || z.betrag)
  const labelFarbe = hatEingabe
    ? 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600'
    : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'

  return (
    <div className={`rounded-lg border p-3 ${labelFarbe}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>

      <div className="flex flex-col gap-2">
        {zeilen.map((zeile, zIdx) => (
          <div key={zeile.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <KontenSelect
                value={zeile.kontonummer}
                onChange={(nr) => onKontoChange(zIdx, nr)}
                config={kontenauswahl}
                placeholder="Konto..."
                disabled={readOnly}
              />
            </div>
            <div className="w-28 shrink-0">
              <input
                type="number"
                value={zeile.betrag}
                onChange={(e) => onBetragChange(zIdx, e.target.value)}
                disabled={readOnly}
                placeholder="CHF"
                min="0"
                step="0.01"
                className={`min-h-[44px] w-full rounded-md border bg-white px-3 py-2
                  text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100
                  focus:outline-none focus:ring-1 focus:ring-slate-400
                  disabled:cursor-not-allowed disabled:opacity-50
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  ${!readOnly && !zeile.betrag ? 'border-violet-400 dark:border-violet-500' : 'border-slate-300 dark:border-slate-600'}`}
              />
            </div>
            {!readOnly && zeilen.length > 1 && (
              <button
                type="button"
                onClick={() => onZeileEntfernen(zIdx)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg
                  text-slate-400 hover:text-red-500 transition-colors"
                title="Zeile entfernen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Zeile hinzufügen */}
      {!readOnly && (
        <button
          type="button"
          onClick={onZeileHinzufuegen}
          className="mt-2 min-h-[44px] flex items-center gap-1 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {label === 'Soll' ? '+ Soll-Zeile' : '+ Haben-Zeile'}
        </button>
      )}
    </div>
  )
}
