import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import type { KontenbestimmungFrage as KontenbestimmungFrageTyp } from '../../types/fragen'
import FeedbackBox from './FeedbackBox'
import KontenSelect from './shared/KontenSelect'

interface ZuordnungState {
  konto: string
  seite: 'soll' | 'haben' | ''
}

export default function KontenbestimmungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing
  if (frage.typ !== 'kontenbestimmung') return null
  const kbFrage = frage as KontenbestimmungFrageTyp

  const kontenauswahl = kbFrage.kontenauswahl
  const konten = (kontenauswahl?.konten || []).map(k => ({ nr: k, name: k }))
  const aufgaben = kbFrage.aufgaben || []

  const [zuordnungen, setZuordnungen] = useState<ZuordnungState[][]>(() =>
    aufgaben.map(a => a.erwarteteAntworten.map(() => ({ konto: '', seite: '' as const })))
  )

  const updateZuordnung = (aufgabeIdx: number, zeileIdx: number, feld: 'konto' | 'seite', wert: string) => {
    if (disabled) return
    const neu = zuordnungen.map(a => a.map(z => ({ ...z })))
    neu[aufgabeIdx][zeileIdx] = { ...neu[aufgabeIdx][zeileIdx], [feld]: wert }
    setZuordnungen(neu)
  }

  const istVollstaendig = zuordnungen.every(a => a.some(z => z.konto && z.seite))

  const handleAbsenden = () => {
    if (!istVollstaendig || disabled) return
    onAntwort({
      typ: 'kontenbestimmung',
      zuordnungen: zuordnungen.map(a =>
        a.filter(z => z.konto && z.seite).map(z => ({
          konto: z.konto,
          seite: z.seite as 'soll' | 'haben',
        }))
      ),
    })
  }

  return (
    <div className="space-y-4">
      {aufgaben.map((aufgabe, ai) => {
        const korrektZeilen = aufgabe.erwarteteAntworten

        return (
          <div key={ai} className="p-3 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
            <p className="text-sm font-medium dark:text-white">
              <span className="text-slate-500 dark:text-slate-400 mr-2">{ai + 1}.</span>
              {aufgabe.text}
            </p>

            {zuordnungen[ai]?.map((z, zi) => {
              const korrZ = feedbackSichtbar && korrektZeilen[zi]
              const kontoOk = korrZ && z.konto === korrZ.kontonummer
              const seiteOk = korrZ && z.seite === korrZ.seite

              return (
                <div key={zi} className="flex gap-2 items-center">
                  <div className={`flex-1 ${feedbackSichtbar ? (kontoOk ? 'ring-2 ring-green-400 rounded-lg' : 'ring-2 ring-red-400 rounded-lg') : ''}`}>
                    <KontenSelect konten={konten} value={z.konto} onChange={(v) => updateZuordnung(ai, zi, 'konto', v)} disabled={disabled} />
                  </div>
                  <select
                    value={z.seite}
                    onChange={(e) => updateZuordnung(ai, zi, 'seite', e.target.value)}
                    disabled={disabled}
                    className={`p-2 rounded-lg border text-sm min-h-[44px] w-24 dark:bg-slate-800 dark:text-white
                      ${feedbackSichtbar ? (seiteOk ? 'border-green-400 ring-2 ring-green-400' : 'border-red-400 ring-2 ring-red-400') : 'border-slate-300 dark:border-slate-600'}
                    `}
                  >
                    <option value="">Seite</option>
                    <option value="soll">Soll</option>
                    <option value="haben">Haben</option>
                  </select>
                </div>
              )
            })}
          </div>
        )
      })}

      {!disabled && istVollstaendig && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={kbFrage.musterlosung} />}
    </div>
  )
}
