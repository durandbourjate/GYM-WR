import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import type { BuchungssatzFrage as BuchungssatzFrageTyp, BuchungssatzZeile } from '../../../types/ueben/fragen'
import FeedbackBox from './FeedbackBox'
import KontenSelect from './shared/KontenSelect'

interface Zeile {
  soll: string
  haben: string
  betrag: string
}

export default function BuchungssatzFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing: Zugriff auf buchungssatz-spezifische Felder
  if (frage.typ !== 'buchungssatz') return null
  const bsFrage = frage as BuchungssatzFrageTyp

  const buchungen = bsFrage.buchungen || []
  const kontenauswahl = bsFrage.kontenauswahl
  // Konten-Liste für KontenSelect aus kontenauswahl extrahieren
  const konten = (kontenauswahl?.konten || []).map(k => ({ nr: k, name: k }))
  const anzahlKorrekt = buchungen.length || 1

  const [zeilen, setZeilen] = useState<Zeile[]>(
    Array.from({ length: anzahlKorrekt }, () => ({ soll: '', haben: '', betrag: '' }))
  )

  const updateZeile = (index: number, feld: keyof Zeile, wert: string) => {
    if (disabled) return
    const neu = [...zeilen]
    neu[index] = { ...neu[index], [feld]: wert }
    setZeilen(neu)
  }

  const zeileHinzufuegen = () => {
    if (disabled) return
    setZeilen([...zeilen, { soll: '', haben: '', betrag: '' }])
  }

  const zeileEntfernen = (index: number) => {
    if (disabled || zeilen.length <= 1) return
    setZeilen(zeilen.filter((_, i) => i !== index))
  }

  const istVollstaendig = zeilen.some(z => z.soll && z.haben && z.betrag)

  const handleAbsenden = () => {
    if (!istVollstaendig || disabled) return
    const antwortZeilen: { soll: string; haben: string; betrag: number }[] = zeilen
      .filter(z => z.soll && z.haben && z.betrag)
      .map(z => ({ soll: z.soll, haben: z.haben, betrag: parseFloat(z.betrag) || 0 }))
    onAntwort({ typ: 'buchungssatz', zeilen: antwortZeilen })
  }

  const korrekteDaten: BuchungssatzZeile[] = buchungen

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr_100px_auto] gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
        <span>Soll</span>
        <span></span>
        <span>Haben</span>
        <span>Betrag</span>
        <span></span>
      </div>

      {/* Zeilen */}
      {zeilen.map((z, i) => {
        const korrZ = feedbackSichtbar && korrekteDaten[i]
        const sollOk = korrZ && z.soll === korrZ.sollKonto
        const habenOk = korrZ && z.haben === korrZ.habenKonto
        const betragOk = korrZ && Math.abs(parseFloat(z.betrag) - korrZ.betrag) < 0.01

        return (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr_100px_auto] gap-2 items-center">
            <div className={feedbackSichtbar ? (sollOk ? 'ring-2 ring-green-400 rounded-lg' : 'ring-2 ring-red-400 rounded-lg') : ''}>
              <KontenSelect konten={konten} value={z.soll} onChange={(v) => updateZeile(i, 'soll', v)} disabled={disabled} placeholder="Soll" />
            </div>
            <span className="text-slate-400 text-sm text-center">an</span>
            <div className={feedbackSichtbar ? (habenOk ? 'ring-2 ring-green-400 rounded-lg' : 'ring-2 ring-red-400 rounded-lg') : ''}>
              <KontenSelect konten={konten} value={z.haben} onChange={(v) => updateZeile(i, 'haben', v)} disabled={disabled} placeholder="Haben" />
            </div>
            <input
              type="number"
              value={z.betrag}
              onChange={(e) => updateZeile(i, 'betrag', e.target.value)}
              disabled={disabled}
              placeholder="CHF"
              className={`p-2 rounded-lg border text-sm min-h-[44px] w-full dark:bg-slate-800 dark:text-white text-right
                ${feedbackSichtbar ? (betragOk ? 'border-green-400 ring-2 ring-green-400' : 'border-red-400 ring-2 ring-red-400') : 'border-slate-300 dark:border-slate-600'}
              `}
            />
            {zeilen.length > 1 && !disabled && (
              <button onClick={() => zeileEntfernen(i)} className="text-red-400 hover:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                ✕
              </button>
            )}
            {zeilen.length <= 1 && <span className="w-[44px]" />}
          </div>
        )
      })}

      {/* Zeile hinzufügen */}
      {!disabled && !feedbackSichtbar && (
        <button onClick={zeileHinzufuegen} className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400">
          + Zeile hinzufuegen
        </button>
      )}

      {/* Korrekte Lösung bei Feedback */}
      {feedbackSichtbar && !korrekt && korrekteDaten.length > 0 && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm">
          <p className="font-medium text-green-800 dark:text-green-200 mb-1">Korrekte Buchung:</p>
          {korrekteDaten.map((z, i) => (
            <p key={i} className="text-green-700 dark:text-green-300">
              {z.sollKonto} an {z.habenKonto} CHF {z.betrag.toLocaleString('de-CH')}
            </p>
          ))}
        </div>
      )}

      {!disabled && istVollstaendig && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={bsFrage.musterlosung} />}
    </div>
  )
}
