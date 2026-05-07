// ExamLab/src/components/fragetypen/TKontoFrage.tsx
import { useState, useEffect } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { TKontoFrage as TKontoFrageType } from '../../types/fragen-storage'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import KontoEingabeForm from './tkonto/KontoEingabeForm.tsx'
import TKontoLoesungAnsicht from './tkonto/TKontoLoesungAnsicht.tsx'
import { vonAntwort, zuAntwort, leereZeile } from './tkonto/tkontoUtils'
import type { KontoEingabe } from './tkonto/tkontoUtils'

interface Props {
  frage: TKontoFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function TKontoFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <TKontoLoesungAnsicht frage={frage} antwort={antwortProp ?? null} />
  }
  return <TKontoAufgabe frage={frage} />
}

function TKontoAufgabe({ frage }: { frage: TKontoFrageType }) {
  const { antwort, onAntwort, speichereZwischenstand, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const gespeicherteAntwort = antwort?.typ === 'tkonto' ? antwort : undefined

  // Lokaler State statt Neuberechnung bei jedem Render (verhindert Cursor-Sprung bei Inputs)
  const [konten, setKontenLokal] = useState<KontoEingabe[]>(() =>
    vonAntwort(gespeicherteAntwort, frage.konten)
  )

  // Bei Fragenwechsel: State neu initialisieren
  useEffect(() => {
    const gespeichert = antwort?.typ === 'tkonto' ? antwort : undefined
    setKontenLokal(vonAntwort(gespeichert, frage.konten))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  function aktualisiere(neueKonten: KontoEingabe[]) {
    setKontenLokal(neueKonten)
    if (speichereZwischenstand) {
      speichereZwischenstand(zuAntwort(neueKonten))
    } else {
      onAntwort(zuAntwort(neueKonten))
    }
  }

  function deepCopy(): KontoEingabe[] {
    return konten.map((k) => ({
      ...k,
      eintraegeLinks: k.eintraegeLinks.map((e) => ({ ...e })),
      eintraegeRechts: k.eintraegeRechts.map((e) => ({ ...e })),
    }))
  }

  function eintragAendern(kontoIdx: number, seite: 'links' | 'rechts', zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    zeilen[zeileIdx] = { ...zeilen[zeileIdx], [feld]: wert }
    aktualisiere(kopie)
  }

  function zeileHinzufuegen(kontoIdx: number, seite: 'links' | 'rechts') {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    zeilen.push(leereZeile())
    aktualisiere(kopie)
  }

  function zeileEntfernen(kontoIdx: number, seite: 'links' | 'rechts', zeileIdx: number) {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    if (zeilen.length <= 1) return
    zeilen.splice(zeileIdx, 1)
    aktualisiere(kopie)
  }

  function feldAendern(kontoIdx: number, feld: keyof KontoEingabe, wert: string) {
    const kopie = deepCopy()
    Object.assign(kopie[kontoIdx], { [feld]: wert })
    aktualisiere(kopie)
  }

  const readOnly = disabled
  const hatGeschaeftsfaelle = !!frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0

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
          T-Konto
        </span>
      </div>

      {/* Aufgabentext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Geschäftsfälle */}
      {frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Geschäftsfälle</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            {frage.geschaeftsfaelle.map((gf, i) => (
              <li key={i}>{gf}</li>
            ))}
          </ol>
        </div>
      )}

      {/* T-Konten */}
      <div className="flex flex-col gap-6">
        {konten.map((konto, kIdx) => (
          <KontoEingabeForm
            key={konto.id}
            konto={konto}
            def={frage.konten[kIdx]}
            bewertungsoptionen={frage.bewertungsoptionen}
            hatGeschaeftsfaelle={hatGeschaeftsfaelle}
            kontenauswahl={frage.kontenauswahl}
            readOnly={readOnly}
            onFeldAendern={(feld, wert) => feldAendern(kIdx, feld, wert)}
            onEintragAendern={(seite, zIdx, feld, wert) => eintragAendern(kIdx, seite, zIdx, feld, wert)}
            onZeileHinzufuegen={(seite) => zeileHinzufuegen(kIdx, seite)}
            onZeileEntfernen={(seite, zIdx) => zeileEntfernen(kIdx, seite, zIdx)}
          />
        ))}
      </div>

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
